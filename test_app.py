from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import stripe

app = Flask(__name__)
CORS(app)

# Initialize Stripe with your secret key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

@app.route('/')
def home():
    return "Test deployment working!"

@app.route('/api/create-setup-intent', methods=['POST'])
def create_setup_intent():
    try:
        data = request.get_json()
        
        # Create a customer
        customer = stripe.Customer.create(
            metadata={
                'price': data.get('price'),
                'service': data.get('service'),
                'address': data.get('address'),
                'lotSize': data.get('lotSize'),
                'date': data.get('date')
            }
        )
        
        # Create a SetupIntent
        setup_intent = stripe.SetupIntent.create(
            customer=customer.id,
            payment_method_types=['card'],
            usage='off_session'  # This allows for future payments
        )
        
        return jsonify({
            'clientSecret': setup_intent.client_secret,
            'customerId': customer.id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
