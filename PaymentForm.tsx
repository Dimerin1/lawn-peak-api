import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

interface PaymentFormProps {
    price: number
    service_type: string
    address: string
    lot_size: string
    phone: string
}

function PaymentForm({ price, service_type, address, lot_size, phone }: PaymentFormProps) {
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [error, setError] = React.useState("")

    const handlePayment = async () => {
        setIsProcessing(true)
        setError("")
        
        try {
            // First create a setup intent on the backend
            const response = await fetch('https://lawn-peak-api.onrender.com/create-setup-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    price: price,
                    service_type: service_type,
                    address: address,
                    lot_size: lot_size,
                    phone: phone,
                    return_url: window.location.origin + '/dashboard'
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create setup intent')
            }

            const { setupIntentUrl } = await response.json()
            
            // Redirect to Stripe's hosted setup page
            window.location.href = setupIntentUrl
            
        } catch (err) {
            console.error('Setup error:', err)
            setError(err.message || 'Failed to setup payment method. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <button
                onClick={handlePayment}
                disabled={isProcessing}
                style={{
                    width: "100%",
                    padding: "16px",
                    backgroundColor: "#FFC043",
                    border: "none",
                    borderRadius: "12px",
                    color: "#000",
                    fontSize: "16px",
                    fontWeight: "500",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    opacity: isProcessing ? 0.7 : 1,
                }}
            >
                {isProcessing ? "Processing..." : "Save Payment Method"}
            </button>
            
            {error && (
                <div style={{
                    color: "#e53e3e",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(229, 62, 62, 0.1)",
                    marginTop: "8px",
                    fontSize: "14px"
                }}>
                    {error}
                </div>
            )}
        </div>
    )
}

addPropertyControls(PaymentForm, {
    price: {
        type: ControlType.Number,
        defaultValue: 0,
    },
    service_type: {
        type: ControlType.String,
        defaultValue: "ONE_TIME",
    },
    address: {
        type: ControlType.String,
        defaultValue: "",
    },
    lot_size: {
        type: ControlType.String,
        defaultValue: "SMALL",
    },
    phone: {
        type: ControlType.String,
        defaultValue: "",
    },
})

export default PaymentForm
