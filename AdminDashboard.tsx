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
    const [filteredCustomers, setFilteredCustomers] = React.useState<Customer[]>([])
    const [chargingCustomerId, setChargingCustomerId] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = React.useState(false)
    const [password, setPassword] = React.useState("")
    const [searchTerm, setSearchTerm] = React.useState("")
    const [sortBy, setSortBy] = React.useState<'date' | 'price' | 'status'>('date')
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
    const [refreshKey, setRefreshKey] = React.useState(0)

    // Simple authentication
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('https://lawn-peak-production.up.railway.app/admin-login', {
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

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('https://lawn-peak-production.up.railway.app/list-customers')
            if (!response.ok) {
                throw new Error('Failed to fetch customers')
            }
            const data = await response.json()
            setCustomers(data.customers)
            setFilteredCustomers(data.customers)
        } catch (err) {
            console.error('Error fetching customers:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch customers')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchCustomers()
    }, [refreshKey])

    React.useEffect(() => {
        let result = [...customers]
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter(customer => 
                customer.metadata.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.metadata.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.metadata.phone.includes(searchTerm)
            )
        }
        
        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return sortOrder === 'asc' 
                        ? a.created - b.created 
                        : b.created - a.created
                case 'price':
                    return sortOrder === 'asc'
                        ? parseFloat(a.metadata.agreed_price) - parseFloat(b.metadata.agreed_price)
                        : parseFloat(b.metadata.agreed_price) - parseFloat(a.metadata.agreed_price)
                case 'status':
                    return sortOrder === 'asc'
                        ? (a.charged === b.charged ? 0 : a.charged ? 1 : -1)
                        : (a.charged === b.charged ? 0 : a.charged ? -1 : 1)
                default:
                    return 0
            }
        })
        
        setFilteredCustomers(result)
    }, [customers, searchTerm, sortBy, sortOrder])

    const handleCharge = async (customerId: string, amount: number) => {
        if (!customerId) return
        
        setChargingCustomerId(customerId)
        try {
            const response = await fetch('https://lawn-peak-production.up.railway.app/charge-customer', {
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

            // Update customers state with the new charge data
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
        const chargeDate = customer.metadata.charge_date 
            ? new Date(parseInt(customer.metadata.charge_date) * 1000).toLocaleDateString()
            : null

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
        )
    }

    const renderDashboardSummary = () => {
        const totalCustomers = customers.length
        const paidCustomers = customers.filter(c => c.charged).length
        const totalRevenue = customers
            .filter(c => c.charged)
            .reduce((sum, c) => sum + parseFloat(c.metadata.agreed_price), 0)

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
                        localStorage.removeItem('adminAuth')
                        setIsAuthenticated(false)
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
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'status')}
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
    )
}

export default AdminDashboard
