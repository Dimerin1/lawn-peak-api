from flask import Flask, request, jsonify, render_template, redirect
from flask_cors import CORS
import os
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If dotenv is not available, we'll rely on OS environment variables
    pass

import stripe
import requests
import json

# Try importing Google services
try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
    GOOGLE_SERVICES_AVAILABLE = True
except ImportError:
    logger.warning("Google services not available. Some features might be limited.")
    GOOGLE_SERVICES_AVAILABLE = False

logger.info("================== STARTING LAWN PEAK API ==================")
logger.info(f"Environment: {os.getenv('FLASK_ENV', 'not set')}")
logger.info(f"Server Software: {os.getenv('SERVER_SOFTWARE', 'not set')}")

# Load and verify Stripe key
stripe_key = os.getenv('STRIPE_SECRET_KEY')
logger.info(f"Stripe Key Present: {bool(stripe_key)}")
if stripe_key:
    logger.info(f"Stripe Key Last 4: {stripe_key[-4:]}")
    logger.info(f"Stripe Key Length: {len(stripe_key)}")

app = Flask(__name__)

# Configure CORS with specific origins
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://lawn-peak-production.up.railway.app",
            "http://localhost:3000",
            "http://localhost:5000",
            "https://lawn-peak-git-main-dimerin1.vercel.app",
            "https://lawn-peak.vercel.app",
            "https://lawn-peak.onrender.com",
            "https://lawn-peak-api.onrender.com"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
logger.info(f"Stripe API Key Set: {bool(stripe.api_key)}")
if not stripe.api_key:
    raise ValueError("STRIPE_SECRET_KEY environment variable is not set")

@app.route('/')
def home():
    return jsonify({"status": "API is running"})

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

@app.route('/create-setup-intent', methods=['POST'])
def create_setup_intent():
    try:
        data = request.json
        print("Received setup intent request with data:", data)
        return_url = data.get('return_url')
        
        if not return_url:
            print("Error: Return URL is required")
            return jsonify({'error': 'Return URL is required'}), 400

        # Create a Customer
        print("Creating Stripe customer with metadata:", {
            'service_type': data.get('service_type'),
            'address': data.get('address'),
            'lot_size': data.get('lot_size'),
            'phone': data.get('phone'),
            'price': str(data.get('price'))
        })
        
        customer = stripe.Customer.create(
            metadata={
                'service_type': data.get('service_type'),
                'address': data.get('address'),
                'lot_size': data.get('lot_size'),
                'phone': data.get('phone'),
                'price': str(data.get('price'))  # Store price for later charging
            }
        )
        print("Created Stripe customer:", customer.id)
        
        # Create a Stripe Checkout Session for setup only
        print("Creating Stripe checkout session for customer:", customer.id)
        session = stripe.checkout.Session.create(
            mode='setup',
            customer=customer.id,
            payment_method_types=['card'],
            metadata={
                'service_type': data.get('service_type'),
                'address': data.get('address'),
                'lot_size': data.get('lot_size'),
                'phone': data.get('phone'),
                'price': str(data.get('price'))
            },
            success_url=return_url + '?setup=success&customer_id={CUSTOMER_ID}',
            cancel_url=return_url + '?setup=canceled',
            payment_intent_data=None,  # Ensure no payment intent is created
            consent_collection={
                'terms_of_service': 'none',  # Don't show terms of service
            },
            custom_text={
                'submit': {
                    'message': 'By adding your card, you agree to be charged after the service is completed. No charges will be made now.'
                }
            }
        )
        print("Created Stripe checkout session:", session.id)
        print("Session URL:", session.url)
        
        return jsonify({
            'setupIntentUrl': session.url
        })

    except Exception as e:
        print('Error creating setup intent:', str(e))
        return jsonify({'error': str(e)}), 400

@app.route('/list-customers', methods=['GET'])
def list_customers():
    try:
        # Debug info
        logger.info("=== LIST CUSTOMERS ENDPOINT ===")
        logger.info(f"Stripe Key Present: {bool(stripe.api_key)}")
        if stripe.api_key:
            logger.info(f"Stripe Key Last 4: {stripe.api_key[-4:]}")
            logger.info(f"Stripe Key Length: {len(stripe.api_key)}")
        
        # Try to retrieve account info first
        try:
            account = stripe.Account.retrieve()
            logger.info(f"Successfully retrieved Stripe account: {account.id}")
        except Exception as e:
            logger.error(f"Error retrieving Stripe account: {str(e)}")
            return jsonify({
                'error': 'Failed to retrieve Stripe account',
                'details': str(e),
                'stripe_key_last_4': stripe.api_key[-4:] if stripe.api_key else None
            }), 500
        
        # Now try to list customers
        try:
            customers = stripe.Customer.list(limit=100)
            logger.info(f"Successfully retrieved {len(customers.data)} customers")
        except Exception as e:
            logger.error(f"Error listing customers: {str(e)}")
            return jsonify({
                'error': 'Failed to list customers',
                'details': str(e),
                'stripe_key_last_4': stripe.api_key[-4:] if stripe.api_key else None
            }), 500
        
        return jsonify({
            'success': True,
            'stripe_account_id': account.id,
            'stripe_key_last_4': stripe.api_key[-4:] if stripe.api_key else None,
            'customers': [{
                'id': customer.id,
                'created': customer.created,
                'metadata': customer.metadata,
                'has_payment_method': bool(customer.invoice_settings.default_payment_method) if customer.invoice_settings else False,
                'charged': bool(customer.metadata.get('charged', False))
            } for customer in customers.data]
        })
    except Exception as e:
        logger.error(f"Unexpected error in list_customers: {str(e)}")
        return jsonify({
            'error': 'Unexpected error',
            'details': str(e),
            'stripe_key_last_4': stripe.api_key[-4:] if stripe.api_key else None
        }), 500

@app.route('/charge-customer', methods=['POST'])
def charge_customer():
    try:
        data = request.json
        customer_id = data.get('customer_id')
        amount = data.get('amount')  # Amount in dollars
        
        if not all([customer_id, amount]):
            return jsonify({'error': 'Customer ID and amount are required'}), 400

        # Get customer's default payment method
        customer = stripe.Customer.retrieve(customer_id)
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type='card'
        )
        
        if not payment_methods.data:
            return jsonify({'error': 'No payment method found for customer'}), 400

        # Create and confirm the payment intent
        payment_intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),  # Convert to cents
            currency='usd',
            customer=customer_id,
            payment_method=payment_methods.data[0].id,
            off_session=True,
            confirm=True,
            metadata=customer.metadata
        )
        
        # Update customer metadata to mark as charged
        customer.metadata['charged'] = True
        customer.save()
        
        return jsonify({
            'success': True,
            'payment_intent_id': payment_intent.id,
            'amount': amount,
            'status': payment_intent.status
        })

    except stripe.error.CardError as e:
        return jsonify({'error': 'Card was declined', 'details': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

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
def get_lot_size_endpoint():
    try:
        data = request.json
        address = data.get('address')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
            
        lot_size = get_lot_size(address)
        if lot_size is None:
            return jsonify({'error': 'Could not determine lot size'}), 400
            
        return jsonify({
            'success': True,
            'lot_size': lot_size
        })
        
    except Exception as e:
        print('Error getting lot size:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/test-stripe', methods=['GET'])
def test_stripe():
    try:
        # Try to list customers to verify Stripe connection
        customers = stripe.Customer.list(limit=100)
        account = stripe.Account.retrieve()
        
        return jsonify({
            'success': True,
            'stripe_account': account.id,
            'customer_count': len(customers.data),
            'customers': [{
                'id': c.id,
                'created': c.created,
                'metadata': c.metadata
            } for c in customers.data]
        })
    except Exception as e:
        print('Error testing Stripe connection:', str(e))
        return jsonify({'error': str(e)}), 500

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

@app.route('/env-test', methods=['GET'])
def env_test():
    """Simple endpoint to check environment variables"""
    env_vars = {
        'FLASK_ENV': os.getenv('FLASK_ENV'),
        'STRIPE_KEY_PRESENT': bool(os.getenv('STRIPE_SECRET_KEY')),
        'STRIPE_KEY_LENGTH': len(os.getenv('STRIPE_SECRET_KEY', '')),
        'STRIPE_KEY_LAST_4': os.getenv('STRIPE_SECRET_KEY', '')[-4:] if os.getenv('STRIPE_SECRET_KEY') else None,
        'SERVER_SOFTWARE': os.getenv('SERVER_SOFTWARE'),
        'PWD': os.getenv('PWD'),
        'PATH': os.getenv('PATH')
    }
    return jsonify(env_vars)

def get_lot_size(address):
    if not GOOGLE_SERVICES_AVAILABLE:
        return None
        
    try:
        # Initialize the Maps API client
        credentials = service_account.Credentials.from_service_account_file(
            'google-credentials.json',
            scopes=['https://www.googleapis.com/auth/places']
        )
        maps_client = build('places', 'v1', credentials=credentials)
        
        # Get place details
        place_result = maps_client.places().findPlaceFromText(
            input_=address,
            inputtype='textquery',
            fields=['place_id', 'geometry']
        ).execute()
        
        if not place_result.get('candidates'):
            return None
            
        place = place_result['candidates'][0]
        location = place['geometry']['location']
        
        # Use the location to estimate lot size
        # This is a simplified example - you'd need to implement actual lot size calculation
        # based on property boundaries
        return '5000'  # Return a default value for now
        
    except Exception as e:
        print('Error in get_lot_size:', str(e))
        return None

def calculate_price(lot_size_range, service_type='ONE_TIME'):
    # Base prices for different service types
    base_prices = {
        'ONE_TIME': 50,
        'BI_WEEKLY': 45,
        'WEEKLY': 40
    }
    
    # Size multipliers
    size_multipliers = {
        '0-5000': 1.0,
        '5001-10000': 1.5,
        '10001-15000': 2.0,
        '15001-20000': 2.5,
        '20001+': 3.0
    }
    
    base_price = base_prices.get(service_type, base_prices['ONE_TIME'])
    multiplier = size_multipliers.get(lot_size_range, size_multipliers['20001+'])
    
    return base_price * multiplier

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
