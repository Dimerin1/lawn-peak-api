from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from dotenv import load_dotenv
import stripe
import requests
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.oauth2 import service_account

app = Flask(__name__)

# Configure CORS with specific origin
CORS(app, resources={
    r"/*": {
        "origins": ["https://fabulous-screenshot-716470.framer.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept", "Origin"],
        "supports_credentials": True
    }
})

# Load environment variables
load_dotenv()

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

@app.route('/')
def home():
    return jsonify({"status": "API is running"})

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
        
        if not lot_size:
            return jsonify({'error': 'Could not determine lot size'}), 400

        return jsonify({
            'lot_size': lot_size,
            'address': address
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_lot_size(address):
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

def calculate_price(lot_size_range, service_type='ONE_TIME'):
    base_prices = {
        'SMALL': 30,    # Up to 5,000 sq ft
        'MEDIUM': 45,   # 5,001 - 10,000 sq ft
        'LARGE': 60,    # 10,001 - 15,000 sq ft
        'XLARGE': 75    # Over 15,000 sq ft
    }
    
    # Service type multipliers
    service_multipliers = {
        'ONE_TIME': 1.0,
        'WEEKLY': 0.9,  # 10% discount
        'BIWEEKLY': 0.95  # 5% discount
    }
    
    base_price = base_prices.get(lot_size_range, base_prices['MEDIUM'])
    multiplier = service_multipliers.get(service_type, 1.0)
    
    final_price = base_price * multiplier
    return round(final_price)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
