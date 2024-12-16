from flask import Flask, request, jsonify, render_template, redirect
from flask_cors import CORS
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If dotenv is not available, we'll rely on OS environment variables
    pass

import stripe
import requests
import json

# Make Google imports optional
GOOGLE_SERVICES_AVAILABLE = False
try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
    GOOGLE_SERVICES_AVAILABLE = True
except ImportError:
    print("Google services not available. Some features might be limited.")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load environment variables
# load_dotenv()

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
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
        return_url = data.get('return_url')
        
        if not return_url:
            return jsonify({'error': 'Return URL is required'}), 400

        # Create a Customer
        customer = stripe.Customer.create(
            metadata={
                'service_type': data.get('service_type'),
                'address': data.get('address'),
                'lot_size': data.get('lot_size'),
                'phone': data.get('phone'),
                'price': str(data.get('price'))  # Store price for later charging
            }
        )
        
        # Create a Stripe Checkout Session for setup only
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

@app.route('/capture-payment', methods=['POST'])
def capture_payment():
    try:
        data = request.get_json()
        customer_id = data.get('customer_id')
        amount = data.get('amount')  # Amount in cents
        
        # Get the customer's default payment method
        customer = stripe.Customer.retrieve(customer_id)
        
        # Create and confirm a PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            customer=customer_id,
            confirm=True,
            metadata={
                'service_type': customer.metadata.get('service_type'),
                'address': customer.metadata.get('address'),
                'lot_size': customer.metadata.get('lot_size'),
                'phone': customer.metadata.get('phone')
            }
        )
        
        return jsonify({
            'success': True,
            'payment_intent': payment_intent.id
        })

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
    if not GOOGLE_SERVICES_AVAILABLE:
        return jsonify({'error': 'Google services not available'}), 503
        
    try:
        data = request.json
        address = data.get('address')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
            
        lot_size = get_lot_size(address)
        if not lot_size:
            return jsonify({'error': 'Could not determine lot size'}), 400

        return jsonify({
            'lot_size': lot_size,
            'address': address
        })

    except Exception as e:
        print('Error getting lot size:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/list-customers', methods=['GET'])
def list_customers():
    try:
        # Fetch all customers from Stripe
        customers = stripe.Customer.list(limit=100)
        
        # Format customer data
        formatted_customers = []
        for customer in customers.data:
            if customer.metadata:  # Only include customers with metadata
                formatted_customers.append({
                    'id': customer.id,
                    'metadata': {
                        'service_type': customer.metadata.get('service_type', ''),
                        'address': customer.metadata.get('address', ''),
                        'lot_size': customer.metadata.get('lot_size', ''),
                        'phone': customer.metadata.get('phone', ''),
                        'agreed_price': customer.metadata.get('price', '0'),
                        'charge_date': customer.metadata.get('charge_date', '')
                    },
                    'created': customer.created,
                    'charged': bool(customer.metadata.get('charge_date'))
                })
        
        return jsonify({
            'success': True,
            'customers': formatted_customers
        })

    except Exception as e:
        print('Error fetching customers:', str(e))
        return jsonify({'error': str(e)}), 500

def get_lot_size(address):
    if not GOOGLE_SERVICES_AVAILABLE:
        return None
        
    try:
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not api_key:
            raise ValueError("Google Maps API key is not configured")

        # Get place_id first
        geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={api_key}"
        response = requests.get(geocode_url)
        
        if response.status_code != 200:
            raise Exception("Failed to geocode address")
            
        data = response.json()
        
        if not data['results']:
            raise Exception("No results found for address")
            
        place_id = data['results'][0]['place_id']
        
        # Then get place details
        details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=geometry&key={api_key}"
        response = requests.get(details_url)
        
        if response.status_code != 200:
            raise Exception("Failed to get place details")
            
        data = response.json()
        
        if 'result' not in data or 'geometry' not in data['result']:
            raise Exception("No geometry data found")
            
        # For now, return a default lot size
        return 5000  # Default to 5000 sq ft

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
