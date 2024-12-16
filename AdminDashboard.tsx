import * as React from "react"

interface Customer {
    id: string
    metadata: {
        service_type: string
        address: string
        lot_size: string
        phone: string
        agreed_price: string
        charged: string
        charge_date: string
    }
    created: number
    has_payment_method: boolean
    charged: boolean
}

function AdminDashboard() {
    const [customers, setCustomers] = React.useState<Customer[]>([])
    const [chargingCustomerId, setChargingCustomerId] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = React.useState(false)
    const [password, setPassword] = React.useState("")

    // Simple authentication
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('https://lawn-peak-api.onrender.com/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            })
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Login failed')
            }
            
            const data = await response.json()
            if (data.success) {
                setIsAuthenticated(true)
                localStorage.setItem('adminAuth', 'true')
            } else {
                alert('Invalid password')
            }
        } catch (err) {
            console.error('Login error:', err)
            alert(err instanceof Error ? err.message : 'Login failed. Please try again.')
        }
    }

    // Check for existing auth on mount
    React.useEffect(() => {
        const isAuth = localStorage.getItem('adminAuth') === 'true'
        setIsAuthenticated(isAuth)
    }, [])

    // Load charged customers from localStorage
    const getChargedCustomers = () => {
        const charged = localStorage.getItem('chargedCustomers')
        return charged ? JSON.parse(charged) : {}
    }

    // Save charged customer to localStorage
    const saveChargedCustomer = (customerId: string, chargeDate: number) => {
        const charged = getChargedCustomers()
        charged[customerId] = chargeDate
        localStorage.setItem('chargedCustomers', JSON.stringify(charged))
    }

    // Check if customer is charged using localStorage
    const isCustomerCharged = (customerId: string) => {
        const charged = getChargedCustomers()
        return !!charged[customerId]
    }

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('https://lawn-peak-api.onrender.com/list-customers')
            if (!response.ok) {
                throw new Error('Failed to fetch customers')
            }
            const data = await response.json()
            setCustomers(data.customers)
        } catch (err) {
            console.error('Error fetching customers:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch customers')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchCustomers()
    }, [])

    const handleCharge = async (customerId: string, amount: number) => {
        if (!customerId) return
        
        setChargingCustomerId(customerId)
        try {
            const response = await fetch('https://lawn-peak-api.onrender.com/charge-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    amount: amount
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to charge customer')
            }

            const data = await response.json()
            if (!data.success) {
                throw new Error('Payment failed')
            }

            // Save to localStorage and update state
            const chargeDate = Math.floor(Date.now() / 1000)
            saveChargedCustomer(customerId, chargeDate)
            
            // Update customers state
            setCustomers(prev => 
                prev.map(customer => 
                    customer.id === customerId
                        ? {
                            ...customer,
                            charged: true,
                            metadata: {
                                ...customer.metadata,
                                charged: 'true',
                                charge_date: String(chargeDate)
                            }
                        }
                        : customer
                )
            )

            alert('Payment collected successfully!')
        } catch (err) {
            console.error('Error charging customer:', err)
            alert(err instanceof Error ? err.message : 'Failed to charge customer')
        } finally {
            setChargingCustomerId(null)
        }
    }

    const renderCustomerCard = (customer: Customer) => {
        if (!customer) return null

        const isCharging = chargingCustomerId === customer.id
        const isCharged = isCustomerCharged(customer.id)
        const chargeDate = customer.metadata.charge_date 
            ? new Date(parseInt(customer.metadata.charge_date) * 1000).toLocaleDateString()
            : null

        return (
            <div key={customer.id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                margin: '8px 0',
                backgroundColor: isCharged ? '#f8f8f8' : 'white'
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
                {isCharged && chargeDate && (
                    <div style={{ marginBottom: '8px', color: 'green' }}>
                        <strong>Payment Status:</strong> Paid on {chargeDate}
                    </div>
                )}
                <button
                    onClick={() => handleCharge(customer.id, parseFloat(customer.metadata.agreed_price))}
                    disabled={isCharging || isCharged}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isCharged ? '#cccccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isCharged ? 'not-allowed' : 'pointer',
                        opacity: isCharging ? 0.7 : 1
                    }}
                >
                    {isCharging ? 'Processing...' : isCharged ? 'Payment Collected' : 'Collect Payment'}
                </button>
            </div>
        )
    }

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
        )
    }

    if (loading) return <div>Loading customers...</div>
    if (error) return <div style={{ color: 'red' }}>{error}</div>
    if (!customers.length) return <div>No customers found</div>

    return (
        <div style={{ padding: '20px' }}>
            <h1>Admin Dashboard</h1>
            <div>
                {customers.map(customer => renderCustomerCard(customer))}
            </div>
            <button
                onClick={() => {
                    localStorage.removeItem('adminAuth')
                    setIsAuthenticated(false)
                }}
                style={{
                    marginTop: "20px",
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
    )
}

export default AdminDashboard
