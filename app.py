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

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://fabulous-screenshot-716470.framer.app",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

@app.route('/')
def home():
    return jsonify({"status": "API is running"})

@app.route('/api/quote', methods=['POST'])
def get_quote():
    try:
        data = request.json
        address = data.get('address')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400

        # Get lot size from Google Maps API
        lot_size = get_lot_size(address)
        
        if not lot_size:
            return jsonify({'error': 'Could not determine lot size'}), 400

        # Calculate price
        price = calculate_price(lot_size)
        
        return jsonify({
            'lot_size': lot_size,
            'price': price,
            'address': address
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/payment/intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.json
        amount = int(float(data.get('amount')))
        
        if not amount:
            return jsonify({'error': 'Amount is required'}), 400

        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=amount * 100,  # Convert to cents
            currency='usd',
            capture_method='manual',  # This enables the pre-authorization flow
            metadata={
                'service_type': data.get('service_type', 'one-time'),
                'address': data.get('address', ''),
                'customer_name': data.get('customer_name', ''),
                'customer_email': data.get('customer_email', ''),
                'customer_phone': data.get('customer_phone', '')
            }
        )

        return jsonify({
            'clientSecret': intent.client_secret,
            'id': intent.id
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/payment/capture/<payment_intent_id>', methods=['POST'])
def capture_payment(payment_intent_id):
    try:
        intent = stripe.PaymentIntent.capture(payment_intent_id)
        return jsonify({'status': intent.status})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_lot_size(address):
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    
    # Get coordinates from address
    geocoding_url = f'https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={api_key}'
    response = requests.get(geocoding_url)
    result = response.json()
    
    if result['status'] != 'OK':
        return None
        
    location = result['results'][0]['geometry']['location']
    lat = location['lat']
    lng = location['lng']
    
    # For this example, we'll return a mock lot size
    # In production, you would use the coordinates to get the actual lot size
    return 5000  # Mock value in square feet

def calculate_price(lot_size):
    # Base price calculation
    base_price = lot_size * 0.003843
    
    # Apply minimum price
    base_price = max(base_price, 30)
    
    # Apply margin
    final_price = base_price * 1.70
    
    # Round to nearest whole number
    return round(final_price)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
