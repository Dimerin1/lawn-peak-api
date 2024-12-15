import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

interface Customer {
    id: string
    metadata: {
        service_type: string
        address: string
        lot_size: string
        phone: string
        agreed_price: string
    }
    created: number
    charged?: boolean
}

function AdminDashboard() {
    const [customers, setCustomers] = React.useState<Customer[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState("")
    const [chargingCustomerId, setChargingCustomerId] = React.useState<string | null>(null)

    // Fetch customers when component mounts
    React.useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const response = await fetch('https://lawn-peak-api.onrender.com/list-customers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            
            if (!response.ok) {
                throw new Error('Failed to fetch customers')
            }

            const data = await response.json()
            setCustomers(data.customers)
        } catch (err) {
            console.error('Error fetching customers:', err)
            setError('Failed to load customers')
        } finally {
            setLoading(false)
        }
    }

    const handleCharge = async (customerId: string, amount: number) => {
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

            // Update the local state to reflect the charge
            setCustomers(prev => 
                prev.map(customer => 
                    customer.id === customerId 
                        ? { ...customer, charged: true }
                        : customer
                )
            )

            alert('Payment collected successfully!')
        } catch (err) {
            console.error('Charge error:', err)
            alert(err.message || 'Failed to collect payment')
        } finally {
            setChargingCustomerId(null)
        }
    }

    if (loading) {
        return <div>Loading customers...</div>
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>
    }

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ 
                fontSize: "24px", 
                marginBottom: "20px",
                fontWeight: "600"
            }}>
                Customer Management
            </h1>
            
            <div style={{ 
                display: "grid", 
                gap: "16px",
                gridTemplateColumns: "1fr",
            }}>
                {customers.map(customer => (
                    <div key={customer.id} style={{
                        padding: "16px",
                        borderRadius: "8px",
                        backgroundColor: "white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        display: "grid",
                        gap: "12px"
                    }}>
                        <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between",
                            alignItems: "center" 
                        }}>
                            <div>
                                <div style={{ fontWeight: "500" }}>
                                    {customer.metadata.address}
                                </div>
                                <div style={{ 
                                    fontSize: "14px",
                                    color: "#666",
                                    marginTop: "4px"
                                }}>
                                    {customer.metadata.service_type} - {customer.metadata.lot_size}
                                </div>
                                <div style={{ 
                                    fontSize: "14px",
                                    color: "#666",
                                    marginTop: "4px"
                                }}>
                                    Phone: {customer.metadata.phone}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ 
                                    fontSize: "20px",
                                    fontWeight: "600",
                                    color: "#2D3748"
                                }}>
                                    ${customer.metadata.agreed_price}
                                </div>
                                <button
                                    onClick={() => handleCharge(customer.id, parseFloat(customer.metadata.agreed_price))}
                                    disabled={chargingCustomerId === customer.id || customer.charged}
                                    style={{
                                        marginTop: "8px",
                                        padding: "8px 16px",
                                        backgroundColor: customer.charged ? "#A0AEC0" : "#FFC043",
                                        border: "none",
                                        borderRadius: "6px",
                                        color: "#000",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        cursor: customer.charged ? "not-allowed" : "pointer",
                                        opacity: chargingCustomerId === customer.id ? 0.7 : 1,
                                    }}
                                >
                                    {customer.charged 
                                        ? "Paid" 
                                        : chargingCustomerId === customer.id 
                                            ? "Processing..." 
                                            : "Collect Payment"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AdminDashboard
