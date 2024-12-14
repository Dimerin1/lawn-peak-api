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
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for all /api routes

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

def calculate_price(lot_size):
    """Calculate price based on lot size with minimum price and margin."""
    base_price = lot_size * 0.003843
    base_price = max(base_price, 30)  # Ensure minimum price of $30
    final_price = base_price * 1.70  # Apply 70% margin
    return round(final_price)  # Round to nearest whole number

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

def create_payment_intent(amount, data):
    """Create a PaymentIntent for the given amount."""
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),  # Convert to cents
            currency='usd',
            capture_method='manual',  # For later capture
            metadata={
                'type': 'lawn_service',
                'created_at': datetime.now().isoformat(),
                'service_type': data.get('service_type', 'one-time'),
                'address': data.get('address', ''),
                'customer_name': data.get('customer_name', ''),
                'customer_email': data.get('customer_email', ''),
                'customer_phone': data.get('customer_phone', '')
            }
        )
        return intent
    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        raise Exception(f"Payment processing error: {str(e)}")

@app.route('/api/quote', methods=['POST'])
def get_quote():
    """Get quote for an address."""
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
def create_payment():
    """Create a PaymentIntent for Stripe."""
    try:
        data = request.json
        amount = data.get('amount')
        
        if not amount:
            return jsonify({'error': 'Amount is required'}), 400

        intent = create_payment_intent(amount, data)
        
        print(f"Created PaymentIntent for ${amount}: {intent.id}")
        
        return jsonify({
            'clientSecret': intent.client_secret,
            'id': intent.id
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/payment/capture/<payment_intent_id>', methods=['POST'])
def capture_payment(payment_intent_id):
    """Capture a previously authorized payment."""
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != 'requires_capture':
            raise Exception(f"Payment cannot be captured. Status: {intent.status}")
        
        captured_intent = stripe.PaymentIntent.capture(payment_intent_id)
        
        print(f"Captured payment for PaymentIntent: {payment_intent_id}")
        
        return jsonify({
            'status': 'succeeded',
            'amount': captured_intent.amount / 100,  # Convert from cents to dollars
            'id': captured_intent.id
        })
    except stripe.error.StripeError as e:
        print(f"Stripe error during capture: {str(e)}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        print(f"Error capturing payment: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    """Render the main page with Stripe publishable key."""
    return render_template('index.html', stripe_publishable_key=os.getenv('STRIPE_PUBLISHABLE_KEY'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
