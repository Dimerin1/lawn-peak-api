from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import stripe
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
import sys
import certifi
import urllib.parse

load_dotenv()

app = Flask(__name__)
CORS(app)

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

try:
    # Get MongoDB URI from environment
    mongo_uri = os.getenv('MONGODB_URI')
    if not mongo_uri:
        raise ValueError("MongoDB URI not found in environment variables")
    
    print("Connecting to MongoDB...", file=sys.stderr)
    
    # Connect with minimal settings
    client = MongoClient(
        mongo_uri,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )
    
    # Test the connection
    client.admin.command('ping')
    print("Successfully connected to MongoDB!", file=sys.stderr)
    
    # Get or create database
    db = client['lawn-peak']
    
    # Get or create collections
    if 'payments' not in db.list_collection_names():
        print("Creating payments collection...", file=sys.stderr)
        db.create_collection('payments')
        print("Payments collection created!", file=sys.stderr)
    
    payments_collection = db['payments']
    
    # Create an index on customer_id if it doesn't exist
    payments_collection.create_index('customer_id', unique=True)
    
except Exception as e:
    print(f"MongoDB Connection Error: {str(e)}", file=sys.stderr)
    raise e

# Admin authentication
ADMIN_PASSWORD = "Qwe123asd456!@"

# Serve static files
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

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
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f5f5f5;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        function AdminDashboard() {
            const [customers, setCustomers] = React.useState([]);
            const [filteredCustomers, setFilteredCustomers] = React.useState([]);
            const [chargingCustomerId, setChargingCustomerId] = React.useState(null);
            const [loading, setLoading] = React.useState(true);
            const [error, setError] = React.useState(null);
            const [isAuthenticated, setIsAuthenticated] = React.useState(false);
            const [password, setPassword] = React.useState("");
            const [searchTerm, setSearchTerm] = React.useState("");
            const [sortBy, setSortBy] = React.useState('date');
            const [sortOrder, setSortOrder] = React.useState('desc');
            const [refreshKey, setRefreshKey] = React.useState(0);

            // Simple authentication
            const handleLogin = async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/admin-login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ password })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Login failed');
                    }
                    
                    const data = await response.json();
                    if (data.success) {
                        setIsAuthenticated(true);
                        localStorage.setItem('adminAuth', 'true');
                    } else {
                        alert('Invalid password');
                    }
                } catch (err) {
                    console.error('Login error:', err);
                    alert(err.message || 'Login failed. Please try again.');
                }
            };

            // Check for existing auth on mount
            React.useEffect(() => {
                const isAuth = localStorage.getItem('adminAuth') === 'true';
                setIsAuthenticated(isAuth);
            }, []);

            const fetchCustomers = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const response = await fetch('/list-customers');
                    if (!response.ok) {
                        throw new Error('Failed to fetch customers');
                    }
                    const data = await response.json();
                    setCustomers(data.customers);
                    setFilteredCustomers(data.customers);
                } catch (err) {
                    console.error('Error fetching customers:', err);
                    setError(err.message || 'Failed to fetch customers');
                } finally {
                    setLoading(false);
                }
            };

            React.useEffect(() => {
                fetchCustomers();
            }, [refreshKey]);

            React.useEffect(() => {
                let result = [...customers];
                
                if (searchTerm) {
                    result = result.filter(customer => 
                        customer.metadata.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        customer.metadata.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        customer.metadata.phone.includes(searchTerm)
                    );
                }
                
                result.sort((a, b) => {
                    switch (sortBy) {
                        case 'date':
                            return sortOrder === 'asc' 
                                ? a.created - b.created 
                                : b.created - a.created;
                        case 'price':
                            return sortOrder === 'asc'
                                ? parseFloat(a.metadata.agreed_price) - parseFloat(b.metadata.agreed_price)
                                : parseFloat(b.metadata.agreed_price) - parseFloat(a.metadata.agreed_price);
                        case 'status':
                            return sortOrder === 'asc'
                                ? (a.charged === b.charged ? 0 : a.charged ? 1 : -1)
                                : (a.charged === b.charged ? 0 : a.charged ? -1 : 1);
                        default:
                            return 0;
                    }
                });
                
                setFilteredCustomers(result);
            }, [customers, searchTerm, sortBy, sortOrder]);

            const handleCharge = async (customerId, amount) => {
                if (!customerId) return;
                
                setChargingCustomerId(customerId);
                try {
                    const response = await fetch('/charge-customer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            customer_id: customerId,
                            amount: amount
                        })
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to charge customer');
                    }

                    const data = await response.json();
                    if (!data.success) {
                        throw new Error('Payment failed');
                    }

                    setCustomers(prev => 
                        prev.map(customer => 
                            customer.id === customerId
                                ? {
                                    ...customer,
                                    charged: true,
                                    metadata: {
                                        ...customer.metadata,
                                        charged: 'true',
                                        charge_date: data.charge_date.toString()
                                    }
                                }
                                : customer
                        )
                    );

                    alert('Payment collected successfully!');
                } catch (err) {
                    console.error('Error charging customer:', err);
                    alert(err.message || 'Failed to charge customer');
                } finally {
                    setChargingCustomerId(null);
                }
            };

            const renderCustomerCard = (customer) => {
                if (!customer) return null;

                const isCharging = chargingCustomerId === customer.id;
                const chargeDate = customer.metadata.charge_date 
                    ? new Date(parseInt(customer.metadata.charge_date) * 1000).toLocaleDateString()
                    : null;

                return (
                    <div key={customer.id} style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '16px',
                        margin: '8px 0',
                        backgroundColor: customer.charged ? '#f8f8f8' : 'white'
                    }}>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>Service Type:</strong> {customer.metadata.service_type}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>Address:</strong> {customer.metadata.address}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>Lot Size:</strong> {customer.metadata.lot_size}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>Phone:</strong> {customer.metadata.phone}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>Price:</strong> ${customer.metadata.agreed_price}
                        </div>
                        {customer.charged && chargeDate && (
                            <div style={{ marginBottom: '8px', color: 'green' }}>
                                <strong>Payment Status:</strong> Paid on {chargeDate}
                            </div>
                        )}
                        <button
                            onClick={() => handleCharge(customer.id, parseFloat(customer.metadata.agreed_price))}
                            disabled={isCharging || customer.charged}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: customer.charged ? '#cccccc' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: customer.charged ? 'not-allowed' : 'pointer',
                                opacity: isCharging ? 0.7 : 1
                            }}
                        >
                            {isCharging ? 'Processing...' : customer.charged ? 'Payment Collected' : 'Collect Payment'}
                        </button>
                    </div>
                );
            };

            const renderDashboardSummary = () => {
                const totalCustomers = customers.length;
                const paidCustomers = customers.filter(c => c.charged).length;
                const totalRevenue = customers
                    .filter(c => c.charged)
                    .reduce((sum, c) => sum + parseFloat(c.metadata.agreed_price), 0);

                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: '#f7fafc',
                        borderRadius: '8px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalCustomers}</div>
                            <div style={{ color: '#4a5568' }}>Total Customers</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{paidCustomers}</div>
                            <div style={{ color: '#4a5568' }}>Payments Collected</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${totalRevenue.toFixed(2)}</div>
                            <div style={{ color: '#4a5568' }}>Total Revenue</div>
                        </div>
                    </div>
                );
            };

            if (!isAuthenticated) {
                return (
                    <div style={{ 
                        maxWidth: "400px", 
                        margin: "40px auto", 
                        padding: "20px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                    }}>
                        <h1 style={{ 
                            fontSize: "24px", 
                            marginBottom: "20px",
                            fontWeight: "600",
                            textAlign: "center"
                        }}>
                            Admin Login
                        </h1>
                        <form onSubmit={handleLogin}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    marginBottom: "16px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "16px"
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    backgroundColor: "#FFC043",
                                    border: "none",
                                    borderRadius: "6px",
                                    color: "#000",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    cursor: "pointer"
                                }}
                            >
                                Login
                            </button>
                        </form>
                    </div>
                );
            }

            if (loading) return <div>Loading customers...</div>;
            if (error) return <div style={{ color: 'red' }}>{error}</div>;
            if (!customers.length) return <div>No customers found</div>;

            return (
                <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '24px'
                    }}>
                        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
                        <button
                            onClick={() => {
                                localStorage.removeItem('adminAuth');
                                setIsAuthenticated(false);
                            }}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#EDF2F7",
                                border: "none",
                                borderRadius: "6px",
                                color: "#4A5568",
                                fontSize: "14px",
                                cursor: "pointer"
                            }}
                        >
                            Logout
                        </button>
                    </div>

                    {renderDashboardSummary()}

                    <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        marginBottom: '24px',
                        alignItems: 'center'
                    }}>
                        <input
                            type="text"
                            placeholder="Search by address, service type, or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                flex: 1
                            }}
                        />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px'
                            }}
                        >
                            <option value="date">Sort by Date</option>
                            <option value="price">Sort by Price</option>
                            <option value="status">Sort by Status</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <button
                            onClick={() => setRefreshKey(k => k + 1)}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Refresh
                        </button>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {filteredCustomers.map(customer => renderCustomerCard(customer))}
                    </div>
                </div>
            );
        }

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

@app.route('/admin-login', methods=['POST'])
def admin_login():
    data = request.get_json()
    if not data or 'password' not in data:
        return jsonify({'error': 'Password is required'}), 400
    
    if data['password'] == ADMIN_PASSWORD:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Invalid password'}), 401

@app.route('/list-customers', methods=['GET'])
def list_customers():
    try:
        print("MongoDB URI:", mongo_uri)  # Print the MongoDB URI (without credentials)
        print("Attempting to fetch payments from MongoDB...")
        
        # Get all payments from MongoDB
        payments = list(payments_collection.find())
        print(f"Found {len(payments)} payments")
        
        # Convert MongoDB _id to string
        for payment in payments:
            payment['_id'] = str(payment['_id'])
        
        # Transform payments into customer format
        customers = []
        for payment in payments:
            try:
                customer = {
                    'id': payment['_id'],
                    'created': payment.get('timestamp', 0),
                    'charged': payment.get('charged', False),
                    'metadata': {
                        'service_type': payment.get('service_type', ''),
                        'address': payment.get('address', ''),
                        'lot_size': payment.get('lot_size', ''),
                        'phone': payment.get('phone', ''),
                        'agreed_price': str(payment.get('amount', 0)),
                        'charged': str(payment.get('charged', False)).lower(),
                        'charge_date': str(payment.get('charge_date', '')) if payment.get('charged') else None
                    }
                }
                customers.append(customer)
            except Exception as e:
                print(f"Error processing payment {payment.get('_id')}: {str(e)}")
                continue
        
        print(f"Processed {len(customers)} customers")
        return jsonify({'customers': customers})
    except Exception as e:
        print(f"Error fetching customers: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch customers: {str(e)}'}), 500

@app.route('/add-test-payment', methods=['GET'])
def add_test_payment():
    try:
        # Add a test payment
        test_payment = {
            'customer_id': 'test_customer_1',
            'timestamp': int(datetime.now().timestamp()),
            'charged': False,
            'service_type': 'Lawn Mowing',
            'address': '123 Test St, Test City',
            'lot_size': 'Medium',
            'phone': '555-0123',
            'amount': 50.00
        }
        
        # Insert or update the test payment
        result = payments_collection.update_one(
            {'customer_id': test_payment['customer_id']},
            {'$set': test_payment},
            upsert=True
        )
        
        return jsonify({
            'success': True,
            'message': 'Test payment added successfully',
            'payment': test_payment
        })
    except Exception as e:
        print(f"Error adding test payment: {str(e)}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
