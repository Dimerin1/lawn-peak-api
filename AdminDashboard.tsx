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
        base_price: string
        final_amount: string
        referral_code?: string
        referral_discount?: string
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
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

    // Axios configuration with CORS headers
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    // Simple authentication
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            setError(null)
            const response = await axios.post(`${API_BASE_URL}/admin-login`, { password }, axiosConfig)
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
            
            const response = await axios.get(`${API_BASE_URL}/list-customers`, axiosConfig)
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
                        ? parseFloat(a.metadata.base_price) - parseFloat(b.metadata.base_price)
                        : parseFloat(b.metadata.base_price) - parseFloat(a.metadata.base_price)
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
    const handleChargeCustomer = async (customerId: string) => {
        try {
            setChargingCustomerId(customerId)
            setError(null)
            setSuccess(null)

            const customer = customers.find(c => c.id === customerId)
            if (!customer) {
                throw new Error('Customer not found')
            }

            const response = await axios.post(
                `${API_BASE_URL}/charge-customer`,
                {
                    customer_id: customerId,
                    amount: parseFloat(customer.metadata.final_amount || customer.metadata.base_price)
                },
                axiosConfig
            )

            if (response.data.success) {
                setSuccess(`Successfully charged customer ${customerId}. Amount: $${response.data.amount_charged}${response.data.discount_applied ? ` (Includes $${response.data.discount_applied} referral discount)` : ''}`)
                setRefreshKey(prev => prev + 1)
            }
        } catch (err: any) {
            setError(`Failed to charge customer: ${err.response?.data?.error || err.message}`)
        } finally {
            setChargingCustomerId(null)
        }
    }

    const handleDeleteAllCustomers = async () => {
        if (!window.confirm('Are you sure you want to delete ALL customers? This cannot be undone!')) {
            return
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/delete-all-customers`, {}, axiosConfig)

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

    const renderCustomerTable = () => {
        return (
            <table className="min-w-full bg-white border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="px-4 py-2 border-b">Created</th>
                        <th className="px-4 py-2 border-b">Address</th>
                        <th className="px-4 py-2 border-b">Service Type</th>
                        <th className="px-4 py-2 border-b">Lot Size</th>
                        <th className="px-4 py-2 border-b">Phone</th>
                        <th className="px-4 py-2 border-b">Base Price</th>
                        <th className="px-4 py-2 border-b">Final Price</th>
                        <th className="px-4 py-2 border-b">Referral</th>
                        <th className="px-4 py-2 border-b">Status</th>
                        <th className="px-4 py-2 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border-b">
                                {new Date(customer.created * 1000).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 border-b">{customer.metadata.address}</td>
                            <td className="px-4 py-2 border-b">{customer.metadata.service_type}</td>
                            <td className="px-4 py-2 border-b">{customer.metadata.lot_size}</td>
                            <td className="px-4 py-2 border-b">{customer.metadata.phone}</td>
                            <td className="px-4 py-2 border-b">${customer.metadata.base_price}</td>
                            <td className="px-4 py-2 border-b">
                                ${customer.metadata.final_amount}
                                {customer.metadata.referral_discount && (
                                    <span className="text-green-600 text-sm ml-1">
                                        (-${customer.metadata.referral_discount})
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-2 border-b">
                                {customer.metadata.referral_code ? (
                                    <span className="text-green-600">
                                        Code: {customer.metadata.referral_code}
                                    </span>
                                ) : '-'}
                            </td>
                            <td className="px-4 py-2 border-b">
                                {customer.charged ? (
                                    <span className="text-green-600">
                                        Charged on {customer.metadata.charge_date}
                                    </span>
                                ) : (
                                    <span className="text-yellow-600">Pending</span>
                                )}
                            </td>
                            <td className="px-4 py-2 border-b">
                                {!customer.charged && customer.has_payment_method && (
                                    <button
                                        onClick={() => handleChargeCustomer(customer.id)}
                                        disabled={chargingCustomerId === customer.id}
                                        className={`px-4 py-2 rounded ${
                                            chargingCustomerId === customer.id
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        }`}
                                    >
                                        {chargingCustomerId === customer.id ? 'Charging...' : 'Charge'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }

    const renderDashboardSummary = () => {
        const totalCustomers = customers.length
        const paidCustomers = customers.filter(c => c.charged).length
        const totalRevenue = customers
            .filter(c => c.charged)
            .reduce((sum, c) => sum + parseFloat(c.metadata.final_amount || c.metadata.base_price), 0)

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

    const renderLoginForm = () => {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f7fafc'
            }}>
                <form onSubmit={handleLogin} style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Admin Login</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: loading ? '#cbd5e0' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                    {error && (
                        <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}
                </form>
            </div>
        )
    }

    if (!isAuthenticated) {
        return renderLoginForm()
    }

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                Loading customers...
            </div>
        )
    }

    if (error && !customers.length) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                color: 'red' 
            }}>
                {error}
            </div>
        )
    }

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

            {renderCustomerTable()}
        </div>
    )
}

export default AdminDashboard
