from flask import Flask, request, jsonify, render_template, redirect, make_response
from flask_cors import CORS
import os
import time
import logging
import stripe
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Stripe with the key from environment
stripe_key = os.getenv('STRIPE_SECRET_KEY')
if not stripe_key:
    logger.error("STRIPE_SECRET_KEY environment variable is not set")
else:
    # Remove any whitespace or newlines
    stripe_key = stripe_key.strip()
    stripe.api_key = stripe_key
    logger.info(f"Using Stripe API key: {stripe_key[:10]}...")
    logger.info(f"Using {'test' if 'test' in stripe_key else 'live'} mode")

# Initialize Google Services
GOOGLE_SERVICES_AVAILABLE = False  # Default to False
google_credentials = None
try:
    # Check both local and Render paths for credentials
    credentials_paths = ['google-credentials.json', '/etc/secrets/google-credentials.json']
    
    for path in credentials_paths:
        if os.path.exists(path):
            google_credentials = service_account.Credentials.from_service_account_file(
                path,
                scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
            GOOGLE_SERVICES_AVAILABLE = True
            logger.info(f"Google credentials loaded successfully from {path}")
            break

    if not GOOGLE_SERVICES_AVAILABLE:
        logger.warning("Google credentials file not found in any location")
except Exception as e:
    logger.error(f"Failed to load Google credentials: {str(e)}")

# Create Flask app
app = Flask(__name__)

# Configure CORS with specific origins
ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://lawnpeak.com',
    'https://lawn-peak-front.onrender.com',
    'https://lawn-peak-api.onrender.com'
]

CORS(app, 
     resources={r"/*": {
         "origins": ALLOWED_ORIGINS,
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Stripe-Publishable-Key"],
         "expose_headers": ["Content-Type"],
         "supports_credentials": False,
         "max_age": 3600
     }}
)

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Stripe-Publishable-Key'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Unhandled error: {str(error)}")
    response = jsonify({
        "error": "An internal server error occurred",
        "details": str(error)
    })
    response.status_code = 500
    return response

# Admin credentials (in production, use environment variables)
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')

@app.route('/admin-login', methods=['POST', 'OPTIONS'])
def admin_login():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        data = request.json
        password = data.get('password')

        if not password:
            return jsonify({'error': 'Password is required'}), 400

        if password == ADMIN_PASSWORD:
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Invalid password'}), 401

    except Exception as e:
        logger.error(f"Error in admin login: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

@app.route('/charge-customer', methods=['POST', 'OPTIONS'])
def charge_customer():
    # Handle preflight CORS request
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response

    try:
        logger.info("Received charge-customer request")
        data = request.json
        logger.info(f"Request data: {data}")
        
        customer_id = data.get('customer_id')
        amount = data.get('amount')  # Amount in dollars
        
        if not all([customer_id, amount]):
            logger.error("Missing required fields")
            return jsonify({'error': 'Customer ID and amount are required'}), 400

        # Get customer's default payment method
        logger.info(f"Retrieving customer {customer_id}")
        customer = stripe.Customer.retrieve(customer_id)
        logger.info(f"Retrieved customer: {customer.id}")
        
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type='card'
        )
        logger.info(f"Found {len(payment_methods.data)} payment methods")
        
        if not payment_methods.data:
            logger.error("No payment method found")
            return jsonify({'error': 'No payment method found for customer'}), 400

        # Create and confirm the payment intent
        logger.info(f"Creating payment intent for amount {amount}")
        payment_intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),  # Convert to cents
            currency='usd',
            customer=customer_id,
            payment_method=payment_methods.data[0].id,
            off_session=True,
            confirm=True,
            metadata=customer.metadata
        )
        logger.info(f"Payment intent created: {payment_intent.id}")
        
        # Update customer metadata to store charge date
        current_time = time.strftime('%d.%m.%Y %H:%M')  # Added time in 24-hour format
        customer_metadata = dict(customer.metadata)  # Convert from StripeObject to dict
        customer_metadata['charge_date'] = current_time
        
        # Update customer with new metadata
        logger.info("Updating customer metadata")
        stripe.Customer.modify(
            customer_id,
            metadata=customer_metadata
        )
        logger.info("Customer metadata updated")
        
        # Get customer data from Google Sheets
        service = get_sheets_service()
        SPREADSHEET_ID = os.getenv('GOOGLE_SHEETS_ID', '19AqlhJ54zBXsED3J3vkY8_WolSnundLakNdfBAJdMXA')
        
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range='A:I'
        ).execute()
        values = result.get('values', [])
        
        # Find the customer's row
        customer_row = None
        for i, row in enumerate(values):
            if len(row) > 2 and row[2] == customer.email:  # Email is in column C (index 2)
                customer_row = i
                break
        
        if customer_row is not None:
            # Update the Charged Date column
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            update_range = f'I{customer_row + 1}'  # +1 because sheets are 1-indexed
            
            service.spreadsheets().values().update(
                spreadsheetId=SPREADSHEET_ID,
                range=update_range,
                valueInputOption='USER_ENTERED',
                body={'values': [[now]]}
            ).execute()
            
            logger.info(f"Updated charge date for customer {customer.email}")
        else:
            logger.warning(f"Customer {customer.email} not found in sheet")
        
        response = jsonify({
            'success': True,
            'payment_intent_id': payment_intent.id,
            'amount': amount,
            'status': payment_intent.status,
            'charge_date': current_time
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        logger.info("Charge completed successfully")
        return response

    except stripe.error.CardError as e:
        logger.error(f"Card error: {str(e)}")
        error_response = jsonify({'error': 'Card was declined', 'details': str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        error_response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return error_response, 400
    except Exception as e:
        logger.error(f"Error charging customer: {str(e)}")
        error_response = jsonify({'error': 'An unexpected error occurred', 'details': str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        error_response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return error_response, 500

@app.route('/')
def home():
    routes = [str(rule) for rule in app.url_map.iter_rules()]
    logger.info(f"Available routes: {routes}")
    return jsonify({
        'status': 'Lawn Peak Backend API is running',
        'version': '1.0',
        'routes': routes,
        'stripe_key_present': bool(stripe.api_key),
        'stripe_key_length': len(stripe.api_key) if stripe.api_key else 0
    })

@app.route('/debug')
def debug():
    """Debug endpoint to check configuration"""
    return jsonify({
        'env_vars': {
            'FLASK_ENV': os.getenv('FLASK_ENV'),
            'FLASK_APP': os.getenv('FLASK_APP'),
            'PORT': os.getenv('PORT'),
            'STRIPE_KEY_LENGTH': len(os.getenv('STRIPE_SECRET_KEY', '')) if os.getenv('STRIPE_SECRET_KEY') else 0
        },
        'routes': [str(rule) for rule in app.url_map.iter_rules()],
        'stripe_key_present': bool(stripe.api_key),
        'stripe_key_last_4': stripe.api_key[-4:] if stripe.api_key else None
    })

@app.route('/debug/stripe')
def debug_stripe():
    try:
        # Test the Stripe connection
        account = stripe.Account.retrieve()
        return jsonify({
            'status': 'ok',
            'stripe_mode': 'test' if 'test' in stripe.api_key else 'live',
            'account_id': account.id,
            'charges_enabled': account.charges_enabled,
            'details_submitted': account.details_submitted
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'stripe_key_prefix': stripe.api_key[:10] if stripe.api_key else None
        }), 400

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        price = data.get('price')
        service_type = data.get('service_type')
        address = data.get('address')
        lot_size = data.get('lot_size')
        success_url = data.get('success_url')
        cancel_url = data.get('cancel_url')

        if not all([price, service_type, address, lot_size, success_url, cancel_url]):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(float(price) * 100),  # Convert to cents
                    'product_data': {
                        'name': f'Lawn Mowing Service - {service_type}',
                        'description': f'Address: {address}\nLot Size: {lot_size}',
                        'images': ['https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?q=80&w=1000'],
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            payment_intent_data={
                'metadata': {
                    'service_type': service_type,
                    'address': address,
                    'lot_size': lot_size
                }
            },
            customer_email=None,  # Optional: Add customer email if available
            billing_address_collection='required',
            shipping_address_collection=None,
            allow_promotion_codes=True,
            locale='auto'
        )

        return jsonify({
            'sessionId': session.id,
            'url': session.url
        })

    except stripe.error.StripeError as e:
        return jsonify({'error': str(e.user_message)}), 400
    except Exception as e:
        print('Error creating checkout session:', str(e))
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.json
        amount = data.get('amount')
        
        if not amount:
            return jsonify({'error': 'Amount is required'}), 400

        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),  # Convert to cents
            currency='usd',
            payment_method_types=['card'],
            metadata={
                'service_type': data.get('service_type', ''),
                'address': data.get('address', ''),
                'lot_size': data.get('lot_size', '')
            }
        )

        return jsonify({
            'clientSecret': intent.client_secret,
            'publishableKey': os.getenv('STRIPE_PUBLISHABLE_KEY', 'pk_test_51ONqUHFIWJQKnfxXBSWTlcKRGpvhBWRtQnxQxBTqVPxAYF3IkXlPHbOJBHQIxULhsqOQRXhTPTz8F8UbNrE7KtGD00yrTDUQbR')
        })

    except stripe.error.StripeError as e:
        return jsonify({'error': str(e.user_message)}), 400
    except Exception as e:
        print('Error creating payment intent:', str(e))
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/create-setup-intent', methods=['POST', 'OPTIONS'])
def create_setup_intent():
    try:
        if request.method == 'OPTIONS':
            return after_request(make_response())

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['service_type', 'address', 'lot_size', 'phone']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        logger.info(f"Creating setup intent with data: {data}")
        
        # Create a new customer
        customer = stripe.Customer.create(
            description="Customer for LawnPeak service",
            metadata={
                'service_type': data.get('service_type'),
                'address': data.get('address'),
                'lot_size': data.get('lot_size'),
                'phone': data.get('phone')
            }
        )
        logger.info(f"Created customer: {customer.id}")

        # Create a checkout session
        session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            mode='setup',
            success_url=data.get('success_url', request.host_url),
            cancel_url=data.get('cancel_url', request.host_url),
            metadata={
                'service_type': data.get('service_type'),
                'address': data.get('address'),
                'lot_size': data.get('lot_size'),
                'phone': data.get('phone')
            }
        )
        logger.info(f"Created session: {session.id}")

        return jsonify({
            'setupIntentUrl': session.url,
            'sessionId': session.id
        })

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return jsonify({'error': str(e.user_message)}), 400
    except Exception as e:
        logger.error(f"Server error in create_setup_intent: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/webhook', methods=['POST'])
def webhook():
    event = None
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({'error': 'Invalid signature'}), 400

    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        print('Payment succeeded:', payment_intent['id'])
        # Here you can add logic to update your database, send confirmation emails, etc.
    
    return jsonify({'status': 'success'})

@app.route('/api/lot-size', methods=['POST'])
def lot_size_endpoint():
    try:
        data = request.json
        if not data or 'address' not in data:
            return jsonify({'error': 'Address is required'}), 400
            
        address = data['address']
        lot_size = get_lot_size(address)
        
        if lot_size is None:
            return jsonify({'error': 'Could not determine lot size'}), 400
            
        return jsonify({
            'success': True,
            'lot_size': lot_size
        })
        
    except Exception as e:
        logger.error(f'Error in lot_size_endpoint: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/test-stripe')
def test_stripe():
    logger.info("Test Stripe endpoint called")
    try:
        logger.info("Testing Stripe connection...")
        customers = stripe.Customer.list(limit=3)
        account = stripe.Account.retrieve()
        logger.info(f"Stripe test successful. Account: {account.id}")
        return jsonify({
            'success': True,
            'stripe_account': account.id,
            'customer_count': len(customers.data)
        })
    except Exception as e:
        logger.error(f"Error testing Stripe connection: {str(e)}")
        return jsonify({
            'error': str(e),
            'stripe_key_present': bool(stripe.api_key),
            'stripe_key_length': len(stripe.api_key) if stripe.api_key else 0
        }), 500

@app.route('/test-stripe-account', methods=['GET'])
def test_stripe_account():
    try:
        # Get Stripe account info
        account = stripe.Account.retrieve()
        
        # List all customers
        customers = stripe.Customer.list(limit=100)
        
        # Get environment info
        env_info = {
            'STRIPE_KEY_LAST_4': stripe.api_key[-4:] if stripe.api_key else None,
            'FLASK_ENV': os.getenv('FLASK_ENV'),
            'SERVER_SOFTWARE': os.getenv('SERVER_SOFTWARE', 'unknown')
        }
        
        return jsonify({
            'success': True,
            'account_id': account.id,
            'customer_count': len(customers.data),
            'customers': [{
                'id': c.id,
                'created': c.created,
                'metadata': c.metadata
            } for c in customers.data],
            'environment': env_info
        })
    except Exception as e:
        print('Error testing Stripe:', str(e))
        return jsonify({
            'error': str(e),
            'stripe_key_last_4': stripe.api_key[-4:] if stripe.api_key else None
        }), 500

@app.route('/create-test-customer')
def create_test_customer():
    logger.info("Create test customer endpoint called")
    try:
        logger.info("Creating test customer...")
        customer = stripe.Customer.create(
            email="test@example.com",
            name="Test Customer",
            metadata={'test': 'true'}
        )
        logger.info(f"Created test customer: {customer.id}")
        return jsonify({
            'success': True,
            'customer': {
                'id': customer.id,
                'email': customer.email,
                'name': customer.name
            }
        })
    except Exception as e:
        logger.error(f"Error creating test customer: {str(e)}")
        return jsonify({
            'error': str(e),
            'stripe_key_present': bool(stripe.api_key)
        }), 500

@app.route('/delete-all-customers', methods=['POST'])
def delete_all_customers():
    try:
        # List all customers
        customers = stripe.Customer.list(limit=100)
        
        # Delete each customer
        deleted_count = 0
        for customer in customers.data:
            stripe.Customer.delete(customer.id)
            deleted_count += 1
            
        return jsonify({
            'success': True,
            'message': f'Successfully deleted {deleted_count} customers'
        })
            
    except stripe.error.StripeError as e:
        return jsonify({'error': str(e.user_message)}), 400
    except Exception as e:
        print('Error deleting customers:', str(e))
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/format-sheet', methods=['POST'])
def format_sheet():
    try:
        logger.info("Creating Google Sheets service...")
        service = get_sheets_service()
        SPREADSHEET_ID = os.getenv('GOOGLE_SHEETS_ID', '19AqlhJ54zBXsED3J3vkY8_WolSnundLakNdfBAJdMXA')

        # First, get all values
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range='A:I'
        ).execute()
        values = result.get('values', [])

        if len(values) == 0:
            return jsonify({'message': 'Sheet is empty'}), 200

        # Remove empty rows and keep only non-empty ones
        non_empty_rows = [row for row in values if any(cell.strip() for cell in row if cell)]
        
        # Clear the entire sheet first
        service.spreadsheets().values().clear(
            spreadsheetId=SPREADSHEET_ID,
            range='A:I',
            body={}
        ).execute()

        # Update with clean data
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range='A1',
            valueInputOption='USER_ENTERED',
            body={'values': non_empty_rows}
        ).execute()

        current_row = len(non_empty_rows)

        # Update headers
        headers = [
            'Timestamp',
            'Customer Name',
            'Email',
            'Service Type',
            'Phone Number',
            'Address',
            'Lot Size',
            'Price ($)',
            'Charged Date'
        ]
        
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range='A1:I1',
            valueInputOption='USER_ENTERED',
            body={'values': [headers]}
        ).execute()

        # Apply formatting
        requests = [
            # Format headers
            {
                "repeatCell": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": 9
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "backgroundColor": {
                                "red": 0.2,
                                "green": 0.5,
                                "blue": 0.3
                            },
                            "textFormat": {
                                "bold": True,
                                "foregroundColor": {
                                    "red": 1.0,
                                    "green": 1.0,
                                    "blue": 1.0
                                }
                            }
                        }
                    },
                    "fields": "userEnteredFormat(backgroundColor,textFormat)"
                }
            },
            # Add borders
            {
                "updateBorders": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 0,
                        "endRowIndex": current_row + 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": 9
                    },
                    "top": {"style": "SOLID"},
                    "bottom": {"style": "SOLID"},
                    "left": {"style": "SOLID"},
                    "right": {"style": "SOLID"},
                    "innerHorizontal": {"style": "SOLID"},
                    "innerVertical": {"style": "SOLID"}
                }
            },
            # Auto-resize columns
            {
                "autoResizeDimensions": {
                    "dimensions": {
                        "sheetId": 0,
                        "dimension": "COLUMNS",
                        "startIndex": 0,
                        "endIndex": 9
                    }
                }
            },
            # Format price column as currency
            {
                "repeatCell": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 1,
                        "endRowIndex": current_row + 1,
                        "startColumnIndex": 7,
                        "endColumnIndex": 8
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "numberFormat": {
                                "type": "CURRENCY",
                                "pattern": "$#,##0.00"
                            }
                        }
                    },
                    "fields": "userEnteredFormat.numberFormat"
                }
            },
            # Format date columns (Timestamp and Charged Date)
            {
                "repeatCell": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 1,
                        "endRowIndex": current_row + 1,
                        "startColumnIndex": 0,  # Timestamp column
                        "endColumnIndex": 1
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "numberFormat": {
                                "type": "DATE_TIME",
                                "pattern": "yyyy-mm-dd hh:mm:ss"
                            }
                        }
                    },
                    "fields": "userEnteredFormat.numberFormat"
                }
            },
            {
                "repeatCell": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 1,
                        "endRowIndex": current_row + 1,
                        "startColumnIndex": 8,  # Charged Date column
                        "endColumnIndex": 9
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "numberFormat": {
                                "type": "DATE_TIME",
                                "pattern": "yyyy-mm-dd hh:mm:ss"
                            }
                        }
                    },
                    "fields": "userEnteredFormat.numberFormat"
                }
            },
            # Freeze header row
            {
                "updateSheetProperties": {
                    "properties": {
                        "sheetId": 0,
                        "gridProperties": {
                            "frozenRowCount": 1
                        }
                    },
                    "fields": "gridProperties.frozenRowCount"
                }
            },
            # Center align all cells
            {
                "repeatCell": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 0,
                        "endRowIndex": current_row + 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": 9
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "horizontalAlignment": "CENTER",
                            "verticalAlignment": "MIDDLE"
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,verticalAlignment)"
                }
            }
        ]

        # Apply all formatting
        service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"requests": requests}
        ).execute()

        logger.info("Successfully formatted existing sheet")
        return jsonify({'success': True, 'message': 'Sheet formatted successfully'})
    except Exception as e:
        logger.error(f"Error formatting sheet: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/append-to-sheet', methods=['POST'])
def append_to_sheet_endpoint():
    try:
        data = request.json
        if append_to_sheet(data):
            return jsonify({'success': True, 'message': 'Data appended to sheet'})
        else:
            return jsonify({'error': 'Failed to append data to sheet'}), 500
    except Exception as e:
        logger.error(f"Error appending to sheet: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/config')
def get_config():
    publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY')
    if not publishable_key:
        logger.error("STRIPE_PUBLISHABLE_KEY environment variable is not set")
        return jsonify({'error': 'Stripe configuration not found'}), 500
    return jsonify({
        'publishableKey': publishable_key
    })

# Google Sheets Integration
def get_sheets_service():
    credentials = service_account.Credentials.from_service_account_info({
        "type": "service_account",
        "project_id": "lawn-quote-calculator",
        "private_key_id": os.getenv('GOOGLE_SHEETS_PRIVATE_KEY_ID'),
        "private_key": os.getenv('GOOGLE_SHEETS_PRIVATE_KEY').replace('\\n', '\n'),
        "client_email": os.getenv('GOOGLE_SHEETS_CLIENT_EMAIL'),
        "client_id": os.getenv('GOOGLE_SHEETS_CLIENT_ID'),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": os.getenv('GOOGLE_SHEETS_CLIENT_X509_CERT_URL')
    })
    return build('sheets', 'v4', credentials=credentials)

def append_to_sheet(data):
    try:
        logger.info("Creating Google Sheets service...")
        service = get_sheets_service()
        SPREADSHEET_ID = os.getenv('GOOGLE_SHEETS_ID', '19AqlhJ54zBXsED3J3vkY8_WolSnundLakNdfBAJdMXA')
        logger.info(f"Using spreadsheet ID: {SPREADSHEET_ID}")
        
        # Format data for sheets
        row = [
            time.strftime('%Y-%m-%d %H:%M:%S'),  # Date
            data.get('name', ''),
            data.get('email', ''),
            data.get('service_type', ''),
            data.get('phone', ''),
            data.get('address', ''),
            data.get('lot_size', ''),
            str(data.get('price', '')),
            data.get('charge_date', '')
        ]
        
        logger.info(f"Prepared row data: {row}")
        
        # First, get the current number of rows
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range='A:I'
        ).execute()
        values = result.get('values', [])
        current_row = len(values) + 1

        # If this is the first row, add headers
        if current_row == 1:
            headers = [
                'Timestamp',
                'Customer Name',
                'Email',
                'Service Type',
                'Phone Number',
                'Address',
                'Lot Size',
                'Price ($)',
                'Charged Date'
            ]
            body = {
                'values': [headers]
            }
            service.spreadsheets().values().append(
                spreadsheetId=SPREADSHEET_ID,
                range='A1:I1',
                valueInputOption='USER_ENTERED',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            current_row = 2

        # Append the new row
        body = {
            'values': [row]
        }
        service.spreadsheets().values().append(
            spreadsheetId=SPREADSHEET_ID,
            range='A:I',
            valueInputOption='USER_ENTERED',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()

        # Apply formatting
        requests = [
            # Format headers
            {
                "repeatCell": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": 9
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "backgroundColor": {
                                "red": 0.2,
                                "green": 0.5,
                                "blue": 0.3
                            },
                            "textFormat": {
                                "bold": True,
                                "foregroundColor": {
                                    "red": 1.0,
                                    "green": 1.0,
                                    "blue": 1.0
                                }
                            }
                        }
                    },
                    "fields": "userEnteredFormat(backgroundColor,textFormat)"
                }
            },
            # Add borders
            {
                "updateBorders": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 0,
                        "endRowIndex": current_row + 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": 9
                    },
                    "top": {"style": "SOLID"},
                    "bottom": {"style": "SOLID"},
                    "left": {"style": "SOLID"},
                    "right": {"style": "SOLID"},
                    "innerHorizontal": {"style": "SOLID"},
                    "innerVertical": {"style": "SOLID"}
                }
            },
            # Auto-resize columns
            {
                "autoResizeDimensions": {
                    "dimensions": {
                        "sheetId": 0,
                        "dimension": "COLUMNS",
                        "startIndex": 0,
                        "endIndex": 9
                    }
                }
            },
            # Format price column as currency
            {
                "repeatCell": {
                    "range": {
                        "sheetId": 0,
                        "startRowIndex": 1,
                        "endRowIndex": current_row + 1,
                        "startColumnIndex": 7,
                        "endColumnIndex": 8
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "numberFormat": {
                                "type": "CURRENCY",
                                "pattern": "$#,##0.00"
                            }
                        }
                    },
                    "fields": "userEnteredFormat.numberFormat"
                }
            },
            # Freeze header row
            {
                "updateSheetProperties": {
                    "properties": {
                        "sheetId": 0,
                        "gridProperties": {
                            "frozenRowCount": 1
                        }
                    },
                    "fields": "gridProperties.frozenRowCount"
                }
            }
        ]

        # Apply all formatting
        service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"requests": requests}
        ).execute()

        logger.info("Successfully formatted sheet")
        return True
    except Exception as e:
        logger.error(f"Error appending to sheet: {str(e)}")
        return False

@app.route('/submit-quote', methods=['POST'])
def submit_quote():
    try:
        logger.info("Received quote submission request")
        data = request.json
        logger.info(f"Quote data received: {data}")
        
        required_fields = ['name', 'email', 'service_type', 'phone', 'address', 'lot_size', 'price']
        
        if not all(field in data for field in required_fields):
            logger.error(f"Missing required fields. Received fields: {data.keys()}")
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Store in Google Sheets
        logger.info("Attempting to store in Google Sheets...")
        if append_to_sheet(data):
            logger.info("Successfully stored in Google Sheets")
            return jsonify({'success': True, 'message': 'Quote submitted successfully'})
        else:
            logger.error("Failed to store in Google Sheets")
            return jsonify({'error': 'Failed to store quote data'}), 500
            
    except Exception as e:
        logger.error(f"Error in submit_quote: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/list-customers', methods=['GET'])
def list_customers():
    try:
        # List all customers
        customers = stripe.Customer.list(limit=100)
        
        # Format customer data
        formatted_customers = []
        for customer in customers.data:
            # Get payment methods for customer
            payment_methods = stripe.PaymentMethod.list(
                customer=customer.id,
                type='card'
            )
            
            has_payment_method = len(payment_methods.data) > 0
            
            # Ensure metadata values are strings and present
            metadata = {
                'service_type': customer.metadata.get('service_type', ''),
                'payment_type': customer.metadata.get('payment_type', ''),
                'address': customer.metadata.get('address', ''),
                'lot_size': customer.metadata.get('lot_size', ''),
                'phone': customer.metadata.get('phone', ''),
                'price': str(customer.metadata.get('price', '0')),  # Ensure price is a string
                'charged': customer.metadata.get('charged', 'false'),
                'charge_date': customer.metadata.get('charge_date', '')
            }
            
            # Print debug information
            print(f"Customer {customer.id} metadata:", customer.metadata)
            print(f"Formatted price:", metadata['price'])
            
            customer_data = {
                'id': customer.id,
                'metadata': metadata,
                'created': customer.created,
                'has_payment_method': has_payment_method,
                'charged': metadata['charged'].lower() == 'true'
            }
            formatted_customers.append(customer_data)
            
        return jsonify({'customers': formatted_customers})
            
    except stripe.error.StripeError as e:
        return jsonify({'error': str(e.user_message)}), 400
    except Exception as e:
        print('Error listing customers:', str(e))
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.errorhandler(404)
def not_found_error(error):
    routes = [str(rule) for rule in app.url_map.iter_rules()]
    logger.error(f"404 Error. Available routes: {routes}")
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested URL was not found on the server.',
        'available_routes': routes
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 Error: {str(error)}")
    return jsonify({
        'error': 'Internal Server Error',
        'message': str(error)
    }), 500

def calculate_price(lot_size_range, service_type='ONE_TIME'):
    # Base prices for different lot sizes
    base_prices = {
        'SMALL': 60,    # Up to 5,000 sq ft
        'MEDIUM': 70,   # 5,000 - 10,000 sq ft
        'LARGE': 75,    # 10,000 - 15,000 sq ft
        'XLARGE': 80    # Over 15,000 sq ft
    }
    
    # Service type discounts
    service_discounts = {
        'ONE_TIME': 0,      # No discount
        'MONTHLY': 0,       # No discount
        'BI_WEEKLY': 0.10,  # 10% discount
        'WEEKLY': 0.20      # 20% discount
    }
    
    base_price = base_prices.get(lot_size_range, base_prices['XLARGE'])
    discount = service_discounts.get(service_type, 0)
    
    # Apply discount and round to nearest $5
    final_price = base_price * (1 - discount)
    return round(final_price / 5) * 5

def get_lot_size(address):
    """
    Determine lot size category based on address.
    Returns one of: SMALL, MEDIUM, LARGE, XLARGE
    """
    try:
        # For now, return a default category
        # In production, this would use Google Maps API to get actual lot size
        return "MEDIUM"
        
    except Exception as e:
        logger.error(f'Error in get_lot_size: {str(e)}')
        return None

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    logger.info(f"Starting app on port {port}")
    app.run(host='0.0.0.0', port=port)
