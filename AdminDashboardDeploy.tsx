import * as React from "react"
import { SERVICES, calculatePrice } from "./PriceCalculator"

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

export default function AdminDashboard() {
    const [customers, setCustomers] = React.useState<Customer[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState("")
    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
    const [showModal, setShowModal] = React.useState(false)
    const [chargeAmount, setChargeAmount] = React.useState("")
    const [chargeError, setChargeError] = React.useState("")
    const [chargeSuccess, setChargeSuccess] = React.useState(false)

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            setError("")
            const response = await fetch('https://lawn-peak-api.onrender.com/customers')
            if (!response.ok) {
                throw new Error('Failed to fetch customers')
            }
            const data = await response.json()
            setCustomers(data)
        } catch (err) {
            setError('Failed to load customers. Please try again.')
            console.error('Error fetching customers:', err)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchCustomers()
    }, [])

    const handleChargeCustomer = async (customer: Customer) => {
        setSelectedCustomer(customer)
        setShowModal(true)
        setChargeAmount(customer.metadata.agreed_price || "")
        setChargeError("")
        setChargeSuccess(false)
    }

    const processCharge = async () => {
        if (!selectedCustomer) return

        try {
            setChargeError("")
            const response = await fetch('https://lawn-peak-api.onrender.com/charge-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_id: selectedCustomer.id,
                    amount: parseFloat(chargeAmount),
                    service_type: selectedCustomer.metadata.service_type,
                    lot_size: selectedCustomer.metadata.lot_size
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to process charge')
            }

            setChargeSuccess(true)
            fetchCustomers() // Refresh customer list
            setTimeout(() => {
                setShowModal(false)
                setSelectedCustomer(null)
                setChargeSuccess(false)
            }, 2000)
        } catch (err) {
            setChargeError(err instanceof Error ? err.message : 'Failed to process charge')
            console.error('Charge error:', err)
        }
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString()
    }

    const getStatusColor = (customer: Customer) => {
        if (customer.charged) return "#48BB78"
        if (customer.has_payment_method) return "#F6AD55"
        return "#FC8181"
    }

    const getStatusText = (customer: Customer) => {
        if (customer.charged) return "Charged"
        if (customer.has_payment_method) return "Ready to Charge"
        return "No Payment Method"
    }

    return (
        <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "20px",
            fontFamily: "system-ui, -apple-system, sans-serif"
        }}>
            <h1 style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "24px",
                color: "#2D3748"
            }}>
                Customer Dashboard
            </h1>

            {error && (
                <div style={{
                    padding: "12px",
                    backgroundColor: "#FED7D7",
                    color: "#C53030",
                    borderRadius: "6px",
                    marginBottom: "16px"
                }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#718096"
                }}>
                    Loading customers...
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gap: "16px",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))"
                }}>
                    {customers.map(customer => (
                        <div
                            key={customer.id}
                            style={{
                                padding: "16px",
                                borderRadius: "8px",
                                backgroundColor: "white",
                                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px"
                            }}
                        >
                            <div style={{
                                fontSize: "14px",
                                color: "#4A5568",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span>Created: {formatDate(customer.created)}</span>
                                <span style={{
                                    padding: "4px 8px",
                                    borderRadius: "9999px",
                                    backgroundColor: getStatusColor(customer),
                                    color: "white",
                                    fontSize: "12px",
                                    fontWeight: "500"
                                }}>
                                    {getStatusText(customer)}
                                </span>
                            </div>

                            <div style={{
                                fontSize: "14px",
                                color: "#2D3748"
                            }}>
                                <div>Address: {customer.metadata.address}</div>
                                <div>Phone: {customer.metadata.phone}</div>
                                <div>Service: {customer.metadata.service_type}</div>
                                <div>Lot Size: {customer.metadata.lot_size}</div>
                                <div>Price: ${customer.metadata.agreed_price}</div>
                                {customer.metadata.charged && (
                                    <div>Charged: ${customer.metadata.charged} on {customer.metadata.charge_date}</div>
                                )}
                            </div>

                            {customer.has_payment_method && !customer.charged && (
                                <button
                                    onClick={() => handleChargeCustomer(customer)}
                                    style={{
                                        marginTop: "8px",
                                        padding: "8px 16px",
                                        backgroundColor: "#48BB78",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "500"
                                    }}
                                >
                                    Charge Customer
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && selectedCustomer && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "24px",
                        borderRadius: "8px",
                        width: "90%",
                        maxWidth: "400px"
                    }}>
                        <h2 style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            marginBottom: "16px",
                            color: "#2D3748"
                        }}>
                            Charge Customer
                        </h2>

                        <div style={{
                            marginBottom: "16px",
                            fontSize: "14px",
                            color: "#4A5568"
                        }}>
                            <div>Address: {selectedCustomer.metadata.address}</div>
                            <div>Service: {selectedCustomer.metadata.service_type}</div>
                            <div>Lot Size: {selectedCustomer.metadata.lot_size}</div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                color: "#4A5568"
                            }}>
                                Charge Amount ($)
                            </label>
                            <input
                                type="number"
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "1px solid #E2E8F0",
                                    borderRadius: "6px",
                                    fontSize: "14px"
                                }}
                            />
                        </div>

                        {chargeError && (
                            <div style={{
                                color: "#C53030",
                                fontSize: "14px",
                                marginBottom: "16px",
                                padding: "8px",
                                backgroundColor: "#FED7D7",
                                borderRadius: "4px"
                            }}>
                                {chargeError}
                            </div>
                        )}

                        {chargeSuccess && (
                            <div style={{
                                color: "#2F855A",
                                fontSize: "14px",
                                marginBottom: "16px",
                                padding: "8px",
                                backgroundColor: "#C6F6D5",
                                borderRadius: "4px"
                            }}>
                                Customer charged successfully!
                            </div>
                        )}

                        <div style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end"
                        }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#EDF2F7",
                                    color: "#4A5568",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processCharge}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#48BB78",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500"
                                }}
                            >
                                Process Charge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
