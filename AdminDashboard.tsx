import * as React from "react"
import axios from 'axios'

interface Customer {
    id: string
    metadata: {
        service_type: string
        payment_type: string
        address: string
        lot_size: string
        phone: string
        price: string
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
    const [success, setSuccess] = React.useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = React.useState(false)
    const [password, setPassword] = React.useState("")
    const [searchTerm, setSearchTerm] = React.useState("")
    const [sortBy, setSortBy] = React.useState<'date' | 'price' | 'status'>('date')
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
    const [filterPaymentType, setFilterPaymentType] = React.useState<'all' | 'one_time' | 'recurring'>('all')
    const [refreshKey, setRefreshKey] = React.useState(0)

    // API configuration
    const API_BASE_URL = 'https://lawn-peak-api.onrender.com'

    // Simple authentication
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            setError(null)
            const response = await axios.post(`${API_BASE_URL}/admin-login`, { password })
            if (response.data.success) {
                setIsAuthenticated(true)
                localStorage.setItem('adminAuth', 'true')
                fetchCustomers() // Fetch customers after successful login
            }
        } catch (err) {
            console.error('Login error:', err)
            setError(err instanceof Error ? err.message : 'Login failed')
            setIsAuthenticated(false)
            localStorage.removeItem('adminAuth')
        } finally {
            setLoading(false)
        }
    }

    // Check for existing auth on mount
    React.useEffect(() => {
        const isAuth = localStorage.getItem('adminAuth') === 'true'
        setIsAuthenticated(isAuth)
        if (isAuth) {
            fetchCustomers()
        } else {
            setLoading(false) // Stop loading if not authenticated
        }
    }, [])

    // Fetch customers
    const fetchCustomers = async () => {
        if (!isAuthenticated) {
            setLoading(false)
            return
        }
        
        try {
            setLoading(true)
            setError(null)
            
            const response = await axios.get(`${API_BASE_URL}/list-customers`)
            if (response.data.customers) {
                setCustomers(response.data.customers)
                setFilteredCustomers(response.data.customers)
            } else {
                throw new Error('No customer data received')
            }
        } catch (err) {
            console.error('Error fetching customers:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch customers')
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setIsAuthenticated(false)
                localStorage.removeItem('adminAuth')
            }
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        if (isAuthenticated) {
            fetchCustomers()
        }
    }, [refreshKey, isAuthenticated])

    React.useEffect(() => {
        let result = [...customers]
        
        // Apply payment type filter
        if (filterPaymentType !== 'all') {
            result = result.filter(customer => 
                customer.metadata.payment_type === filterPaymentType
            )
        }
        
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
                        ? parseFloat(a.metadata.price) - parseFloat(b.metadata.price)
                        : parseFloat(b.metadata.price) - parseFloat(a.metadata.price)
                case 'status':
                    return sortOrder === 'asc'
                        ? (a.charged === b.charged ? 0 : a.charged ? 1 : -1)
                        : (a.charged === b.charged ? 0 : a.charged ? -1 : 1)
                default:
                    return 0
            }
        })
        
        setFilteredCustomers(result)
    }, [customers, searchTerm, sortBy, sortOrder, filterPaymentType])

    // Handle charging customer
    const handleChargeCustomer = async (customerId: string, amount: number) => {
        if (!customerId || amount <= 0) {
            setError('Invalid customer ID or amount')
            return
        }
        
        setChargingCustomerId(customerId)
        try {
            const response = await axios.post(`${API_BASE_URL}/charge-customer`, { 
                customer_id: customerId,
                amount: amount
            })

            if (!response.data.success) {
                throw new Error('Payment failed')
            }

            // Update the customer's charged status in the local state
            setCustomers(prevCustomers => 
                prevCustomers.map(customer => 
                    customer.id === customerId
                        ? {
                            ...customer,
                            metadata: {
                                ...customer.metadata,
                                charged: 'true',
                                charge_date: new Date().toISOString() // Use current date if not provided by backend
                            }
                        }
                        : customer
                )
            )
            setSuccess('Customer charged successfully')
        } catch (err) {
            console.error('Error charging customer:', err)
            setError(err instanceof Error ? err.message : 'Failed to charge customer')
        } finally {
            setChargingCustomerId(null)
        }
    }

    const handleDeleteAllCustomers = async () => {
        if (!window.confirm('Are you sure you want to delete ALL customers? This cannot be undone!')) {
            return
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/delete-all-customers`)

            if (!response.data.success) {
                throw new Error('Failed to delete customers')
            }

            // Refresh the customer list
            setRefreshKey(prev => prev + 1)
        } catch (err) {
            console.error('Error deleting customers:', err)
            alert(err instanceof Error ? err.message : 'Failed to delete customers')
        }
    }

    const formatPrice = (price: string | undefined): string => {
        if (!price) return '$0.00'
        const numericPrice = parseFloat(price)
        return isNaN(numericPrice) ? '$0.00' : `$${numericPrice.toFixed(2)}`
    }

    const renderCustomerCard = (customer: Customer) => {
        if (!customer) return null

        const metadata = customer.metadata || {}
        const createdDate = new Date(customer.created * 1000).toLocaleDateString()
        const displayPrice = formatPrice(metadata.price)

        return (
            <div key={customer.id} style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}>
                <div style={{ marginBottom: "8px" }}>
                    <strong>Created:</strong> {createdDate}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Service:</strong> {customer.metadata.service_type || 'N/A'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Payment Type:</strong> {customer.metadata.payment_type || 'N/A'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Price:</strong> ${customer.metadata.price || '0'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Address:</strong> {customer.metadata.address || 'N/A'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Phone:</strong> {customer.metadata.phone || 'N/A'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Lot Size:</strong> {customer.metadata.lot_size || 'N/A'} sq ft
                </div>
                {customer.metadata.charge_date && (
                    <div style={{ marginBottom: '8px', color: 'green' }}>
                        <strong>Last Charged:</strong> {new Date(customer.metadata.charge_date).toLocaleDateString()}
                    </div>
                )}
                {customer.has_payment_method && (
                    <button
                        onClick={() => handleChargeCustomer(customer.id, parseFloat(customer.metadata.price))}
                        disabled={chargingCustomerId === customer.id}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "4px",
                            backgroundColor: chargingCustomerId === customer.id ? "#ccc" : "#4CAF50",
                            color: "white",
                            border: "none",
                            cursor: chargingCustomerId === customer.id ? "not-allowed" : "pointer",
                            marginTop: "8px"
                        }}
                    >
                        {chargingCustomerId === customer.id ? "Processing..." : "Charge Customer"}
                    </button>
                )}
            </div>
        )
    }

    const renderDashboardSummary = () => {
        const totalCustomers = customers.length
        const paidCustomers = customers.filter(c => c.charged).length
        const totalRevenue = customers
            .filter(c => c.charged)
            .reduce((sum, c) => sum + parseFloat(c.metadata.price), 0)

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

            {error && (
                <div style={{ color: 'red', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ color: 'green', marginBottom: '1rem' }}>
                    {success}
                </div>
            )}

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
                    value={filterPaymentType}
                    onChange={(e) => setFilterPaymentType(e.target.value as 'all' | 'one_time' | 'recurring')}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                    }}
                >
                    <option value="all">All Payment Types</option>
                    <option value="one_time">One-time</option>
                    <option value="recurring">Recurring</option>
                </select>
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
                <button
                    onClick={handleDeleteAllCustomers}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "4px",
                        border: "none",
                        background: "#dc3545",
                        color: "#fff",
                        cursor: "pointer"
                    }}
                >
                    Delete All Customers
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
