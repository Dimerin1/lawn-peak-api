import os
import sys
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import stripe
import sqlite3
from datetime import datetime
import json
import traceback

app = Flask(__name__)
CORS(app)

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
if not stripe.api_key:
    print("Warning: STRIPE_SECRET_KEY not found in environment variables", file=sys.stderr)

# Initialize SQLite database
def init_db():
    try:
        conn = sqlite3.connect('payments.db')
        c = conn.cursor()
        
        # Create payments table if it doesn't exist
        c.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                customer_id TEXT UNIQUE,
                address TEXT,
                service_type TEXT,
                phone TEXT,
                agreed_price REAL,
                charged BOOLEAN DEFAULT FALSE,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        print("Database initialized successfully!", file=sys.stderr)
    except Exception as e:
        print("Database initialization error:", str(e), file=sys.stderr)
        raise e

# Initialize database on startup
init_db()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

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
        conn = sqlite3.connect('payments.db')
        conn.row_factory = dict_factory
        c = conn.cursor()
        c.execute('SELECT * FROM payments WHERE customer_id = ?', (customer_id,))
        payment = c.fetchone()
        if payment:
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
            # Store payment record in SQLite
            c.execute('''
                INSERT INTO payments (id, customer_id, address, service_type, phone, agreed_price, charged, created)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                customer_id,
                customer_id,
                customer.address,
                customer.service_type,
                customer.phone,
                amount,
                True,
                datetime.utcnow()
            ))
            conn.commit()
            conn.close()

            return jsonify({
                'success': True,
                'payment_intent_id': payment_intent.id,
                'amount': amount,
                'status': payment_intent.status,
                'charge_date': int(datetime.utcnow().timestamp())
            })
        else:
            return jsonify({'error': 'Payment failed', 'status': payment_intent.status}), 400

    except stripe.error.CardError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print('Error charging customer:', str(e), file=sys.stderr)
        print("Error Type:", type(e).__name__, file=sys.stderr)
        print("Error Details:", str(e), file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
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
        conn = sqlite3.connect('payments.db')
        conn.row_factory = dict_factory
        c = conn.cursor()
        c.execute('SELECT * FROM payments')
        payments = c.fetchall()
        conn.close()
        
        # Transform payments into customer format
        customers = []
        for payment in payments:
            customer = {
                'id': payment['id'],
                'created': int(payment['created'].timestamp()),
                'charged': payment['charged'],
                'metadata': {
                    'service_type': payment['service_type'],
                    'address': payment['address'],
                    'phone': payment['phone'],
                    'agreed_price': str(payment['agreed_price']),
                    'charged': str(payment['charged']).lower(),
                    'charge_date': str(int(payment['created'].timestamp())) if payment['charged'] else None
                }
            }
            customers.append(customer)
        
        return jsonify({'customers': customers})
    except Exception as e:
        print(f"Error fetching customers: {str(e)}", file=sys.stderr)
        print("Error Type:", type(e).__name__, file=sys.stderr)
        print("Error Details:", str(e), file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return jsonify({'error': f'Failed to fetch customers: {str(e)}'}), 500

@app.route('/add-test-payment', methods=['GET'])
def add_test_payment():
    try:
        # Add a test payment
        test_payment = {
            'customer_id': 'test_customer_1',
            'address': '123 Test St, Test City',
            'service_type': 'Lawn Mowing',
            'phone': '555-0123',
            'agreed_price': 50.00
        }
        
        # Insert or update the test payment
        conn = sqlite3.connect('payments.db')
        c = conn.cursor()
        c.execute('''
            INSERT OR REPLACE INTO payments (id, customer_id, address, service_type, phone, agreed_price, charged, created)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            test_payment['customer_id'],
            test_payment['customer_id'],
            test_payment['address'],
            test_payment['service_type'],
            test_payment['phone'],
            test_payment['agreed_price'],
            False,
            datetime.utcnow()
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Test payment added successfully',
            'payment': test_payment
        })
    except Exception as e:
        print(f"Error adding test payment: {str(e)}", file=sys.stderr)
        print("Error Type:", type(e).__name__, file=sys.stderr)
        print("Error Details:", str(e), file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
