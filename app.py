from flask import Flask, request, jsonify, render_template, redirect
from flask_cors import CORS
import os
import time
import logging
import stripe
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
if not stripe.api_key:
    logger.error("STRIPE_SECRET_KEY environment variable is not set")

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",
                "https://lawn-peak.vercel.app",
                "https://lawn-peak-production.up.railway.app",
                "https://lawn-peak-api.onrender.com"
            ],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

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

    @app.route('/test-stripe')
    def test_stripe():
        try:
            logger.info("Testing Stripe connection...")
            customers = stripe.Customer.list(limit=100)
            account = stripe.Account.retrieve()
            logger.info(f"Stripe test successful. Account: {account.id}")
            
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
        try:
            logger.info("Creating test customer...")
            customer = stripe.Customer.create(
                email="test@example.com",
                name="Test Customer",
                metadata={
                    'service_type': 'test',
                    'address': '123 Test St',
                    'lot_size': '1000',
                    'test_customer': 'true'
                }
            )
            logger.info(f"Created test customer: {customer.id}")
            
            return jsonify({
                'success': True,
                'customer': {
                    'id': customer.id,
                    'email': customer.email,
                    'name': customer.name,
                    'created': customer.created,
                    'metadata': customer.metadata
                }
            })
        except Exception as e:
            logger.error(f"Error creating test customer: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'stripe_key_present': bool(stripe.api_key),
                'stripe_key_length': len(stripe.api_key) if stripe.api_key else 0
            }), 500

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

    return app

# Create the Flask application
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    logger.info(f"Starting app on port {port}")
    app.run(host='0.0.0.0', port=port)

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
