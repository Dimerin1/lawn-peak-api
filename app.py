from flask import Flask, request, jsonify
from flask_cors import CORS
import stripe
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Connect to MongoDB Atlas
mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/lawn-peak')
client = MongoClient(mongo_uri)
db = client['lawn-peak']
payments_collection = db['payments']

# Admin authentication
ADMIN_PASSWORD = "Qwe123asd456!@"

@app.route('/')
def root():
    return jsonify({'status': 'Lawn Peak Backend API is running'})

@app.route('/admin')
def admin():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Lawn Peak Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    </head>
    <body>
        <div id="root"></div>
        <script type="text/babel">
            """ + open('AdminDashboard.tsx', 'r').read() + """
            ReactDOM.render(<AdminDashboard />, document.getElementById('root'));
        </script>
    </body>
    </html>
    """

@app.route('/charge-customer', methods=['POST'])
def charge_customer():
    try:
        data = request.json
        customer_id = data.get('customer_id')
        amount = data.get('amount')
        
        if not all([customer_id, amount]):
            return jsonify({'error': 'Customer ID and amount are required'}), 400

        # Check if customer has already been charged
        if payments_collection.find_one({'customer_id': customer_id}):
            return jsonify({'error': 'Customer has already been charged'}), 400

        # Get customer data from Stripe
        customer = stripe.Customer.retrieve(customer_id)
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type='card'
        )
        
        if not payment_methods.data:
            return jsonify({'error': 'No payment method found for customer'}), 400

        # Create payment intent
        payment_intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),  # Convert to cents
            currency='usd',
            customer=customer_id,
            payment_method=payment_methods.data[0].id,
            confirm=True,
            off_session=True
        )

        if payment_intent.status == 'succeeded':
            # Store payment record in MongoDB
            payment_record = {
                'customer_id': customer_id,
                'amount': amount,
                'charge_date': datetime.utcnow(),
                'stripe_payment_id': payment_intent.id
            }
            payments_collection.insert_one(payment_record)

            # Update customer metadata in Stripe
            current_time = int(datetime.utcnow().timestamp())
            metadata = dict(customer.metadata or {})
            metadata['charged'] = 'true'
            metadata['charge_date'] = str(current_time)
            
            stripe.Customer.modify(
                customer_id,
                metadata=metadata
            )
            
            return jsonify({
                'success': True,
                'payment_intent_id': payment_intent.id,
                'amount': amount,
                'status': payment_intent.status,
                'charge_date': current_time
            })
        else:
            return jsonify({'error': 'Payment failed', 'status': payment_intent.status}), 400

    except stripe.error.CardError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print('Error charging customer:', str(e))
        return jsonify({'error': str(e)}), 400

@app.route('/list-customers', methods=['GET'])
def list_customers():
    try:
        customers = stripe.Customer.list(limit=100)
        
        # Check payment status for each customer
        for customer in customers.data:
            payment = payments_collection.find_one({'customer_id': customer.id})
            if payment:
                if not customer.get('metadata'):
                    customer['metadata'] = {}
                customer['metadata']['charged'] = 'true'
                customer['metadata']['charge_date'] = str(int(payment['charge_date'].timestamp()))
            else:
                if not customer.get('metadata'):
                    customer['metadata'] = {}
                customer['metadata']['charged'] = 'false'
            
            payment_methods = stripe.PaymentMethod.list(
                customer=customer.id,
                type='card'
            )
            
            if payment_methods.data:
                customer['has_payment_method'] = True
            else:
                customer['has_payment_method'] = False
        
        return jsonify({'customers': customers.data})
    except Exception as e:
        print('Error listing customers:', str(e))
        return jsonify({'error': str(e)}), 400

@app.route('/admin-login', methods=['POST'])
def admin_login():
    data = request.json
    password = data.get('password')
    
    if password == ADMIN_PASSWORD:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Invalid password'}), 401

if __name__ == '__main__':
    app.run(debug=True)
