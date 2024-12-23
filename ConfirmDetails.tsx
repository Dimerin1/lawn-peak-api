import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// Service configuration
const SERVICES = {
    ONE_TIME: { name: 'One-time Service', price: 60 },
    WEEKLY: { name: 'Weekly Service', price: 45 },
    BI_WEEKLY: { name: 'Bi-weekly Service', price: 50 },
    MONTHLY: { name: 'Monthly Service', price: 55 }
}

export default function Component(props) {
    const {
        service = "",
        startDate = "",
        address = "",
        price = ""
    } = props

    const getServiceName = (serviceType: string) => {
        if (!serviceType) return 'Select service';
        return SERVICES[serviceType]?.name || 'Standard Service'
    }

    return (
        <div
            style={{
                backgroundColor: "white",
                borderRadius: "20px",
                padding: "32px",
                width: "100%",
                maxWidth: "480px",
                margin: "0 auto",
                fontFamily: "Be Vietnam Pro"
            }}
        >
            <h2
                style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#333333",
                    textAlign: "center",
                    marginTop: 0,
                    marginBottom: "24px"
                }}
            >
                Confirm Your Details
            </h2>

            <div
                style={{
                    backgroundColor: "#F5F5F5",
                    padding: "24px",
                    borderRadius: "12px",
                    marginBottom: "24px"
                }}
            >
                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "16px"
                }}>
                    <span style={{ color: "#666666" }}>Service Type</span>
                    <strong>{getServiceName(service)}</strong>
                </div>

                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "16px"
                }}>
                    <span style={{ color: "#666666" }}>First Service</span>
                    <strong>{startDate || 'Select date'}</strong>
                </div>

                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "16px"
                }}>
                    <span style={{ color: "#666666" }}>Location</span>
                    <strong style={{ textAlign: "right", maxWidth: "250px" }}>
                        {address || 'Enter address'}
                    </strong>
                </div>

                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: "1px solid #E5E5E5"
                }}>
                    <span style={{ color: "#666666" }}>Total Price</span>
                    <strong style={{ fontSize: "20px" }}>${price || '0'}</strong>
                </div>
            </div>

            <div
                style={{
                    padding: "16px",
                    backgroundColor: "#F8FFF9",
                    borderRadius: "12px",
                    border: "1px solid #E5F5E7",
                    marginBottom: "24px",
                    fontSize: "14px"
                }}
            >
                <div style={{ 
                    color: "#34C759", 
                    marginBottom: "8px"
                }}>✓ No upfront payment required</div>
                <div style={{ 
                    color: "#34C759", 
                    marginBottom: "8px"
                }}>✓ Free cancellation up to 24h before service</div>
                <div style={{ 
                    color: "#34C759"
                }}>✓ 100% satisfaction guarantee</div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
                <button
                    style={{
                        flex: "1",
                        padding: "16px 24px",
                        backgroundColor: "#F5F5F5",
                        border: "none",
                        borderRadius: "12px",
                        color: "#333333",
                        fontSize: "16px",
                        fontWeight: "500",
                        cursor: "pointer"
                    }}
                >
                    ← Back
                </button>

                <button
                    style={{
                        flex: "2",
                        padding: "16px 24px",
                        backgroundColor: "#F7C35F",
                        border: "none",
                        borderRadius: "12px",
                        color: "#000000",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    Add Payment Method
                </button>
            </div>

            <div style={{ 
                textAlign: "center", 
                color: "#666666", 
                fontSize: "14px",
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
            }}>
                <span style={{ color: "#000" }}>🔒</span>
                Secure payment powered by Stripe
            </div>
        </div>
    )
}

// Add Framer property controls
addPropertyControls(Component, {
    service: {
        type: ControlType.String,
        title: "Service Type",
        defaultValue: ""
    },
    startDate: {
        type: ControlType.String,
        title: "Start Date",
        defaultValue: ""
    },
    address: {
        type: ControlType.String,
        title: "Address",
        defaultValue: ""
    },
    price: {
        type: ControlType.String,
        title: "Price",
        defaultValue: ""
    }
})
