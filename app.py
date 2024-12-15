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
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept", "Origin", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
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

@app.route('/api/lot-size', methods=['POST'])
def get_lot_size_endpoint():
    try:
        data = request.json
        address = data.get('address')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400

        # Get lot size using existing function
        lot_size = get_lot_size(address)
        
        if not lot_size:
            return jsonify({'error': 'Could not determine lot size'}), 400

        return jsonify({
            'lot_size': lot_size,
            'address': address
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/calculate-price', methods=['POST'])
def calculate_price_endpoint():
    try:
        data = request.json
        print("Received price calculation request:", data)  # Debug log
        
        lot_size = data.get('lot_size')
        service = data.get('service')
        
        if not lot_size:
            return jsonify({'error': 'Lot size is required'}), 400
            
        if not isinstance(lot_size, (int, float)):
            return jsonify({'error': f'Invalid lot size type: {type(lot_size)}. Expected number.'}), 400
            
        if not service:
            return jsonify({'error': 'Service type is required'}), 400
            
        if service not in ['weekly', 'biweekly', 'one time']:
            return jsonify({'error': f'Invalid service type: {service}'}), 400

        # Calculate base price
        price = calculate_price(lot_size)
        print(f"Base price for {lot_size} sq ft: ${price}")  # Debug log
        
        # Apply service discount
        if service == 'weekly':
            price = round(price * 0.9)  # 10% discount
            print("Applied 10% weekly discount")  # Debug log
        elif service == 'biweekly':
            price = round(price * 0.95)  # 5% discount
            print("Applied 5% biweekly discount")  # Debug log

        response_data = {
            'price': price,
            'service': service,
            'lot_size': lot_size
        }
        print("Sending response:", response_data)  # Debug log
        return jsonify(response_data)

    except Exception as e:
        print(f"Error in price calculation: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-payment', methods=['POST'])
def create_payment_endpoint():
    try:
        data = request.json
        amount = data.get('amount')
        customer = data.get('customer', {})
        service = data.get('service')
        
        if not amount:
            return jsonify({'error': 'Amount is required'}), 400

        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency='usd',
            capture_method='manual',  # This enables the pre-authorization flow
            metadata={
                'service': service,
                'address': customer.get('address', ''),
                'name': customer.get('name', ''),
                'email': customer.get('email', ''),
                'phone': customer.get('phone', '')
            }
        )

        return jsonify({
            'clientSecret': intent.client_secret,
            'id': intent.id
        })

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
