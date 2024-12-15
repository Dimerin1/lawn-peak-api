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
    r"/api/*": {
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
        service = data.get('service', '').lower()  # Convert to lowercase
        
        if not lot_size:
            return jsonify({'error': 'Lot size is required'}), 400
            
        if not isinstance(lot_size, (int, float)):
            return jsonify({'error': f'Invalid lot size type: {type(lot_size)}. Expected number.'}), 400
            
        if not service:
            return jsonify({'error': 'Service type is required'}), 400

        # Calculate base price
        price = calculate_price(lot_size)
        print(f"Base price for {lot_size} sq ft: ${price}")  # Debug log
        
        # Apply service discount based on keywords
        if 'weekly' in service:
            price = round(price * 0.9)  # 10% discount
            print("Applied 10% weekly discount")  # Debug log
        elif 'biweekly' in service:
            price = round(price * 0.95)  # 5% discount
            print("Applied 5% biweekly discount")  # Debug log
        else:
            print("No discount applied (one-time service)")  # Debug log

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
    
    # Get place details to find the property area
    place_url = f'https://maps.googleapis.com/maps/api/place/details/json?place_id={result["results"][0]["place_id"]}&fields=geometry&key={api_key}'
    place_response = requests.get(place_url)
    place_result = place_response.json()
    
    if place_result['status'] != 'OK':
        return None
    
    # Calculate approximate lot size from viewport
    viewport = place_result['result']['geometry']['viewport']
    ne = viewport['northeast']
    sw = viewport['southwest']
    
    # Calculate width and height in meters
    from math import radians, cos, sin, asin, sqrt
    
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371000  # Earth radius in meters
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        return R * c
    
    width = haversine(ne['lat'], sw['lng'], ne['lat'], ne['lng'])
    height = haversine(ne['lat'], sw['lng'], sw['lat'], sw['lng'])
    
    # Convert square meters to square feet and apply a residential factor
    # Viewport is usually much larger than the actual property
    lot_size = (width * height * 10.764) * 0.15  # 15% of viewport area
    
    # Apply some reasonable constraints for residential properties
    min_size = 1000  # Minimum lot size in sq ft
    max_size = 20000  # Maximum lot size in sq ft (about half acre)
    
    return max(min(round(lot_size), max_size), min_size)

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
