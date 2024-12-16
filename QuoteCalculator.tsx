import * as React from "react"
import { AddressInput } from "./AddressInput"

// Service configuration
const SERVICES = {
    ONE_TIME: { name: "One-time mowing", discount: 0 },
    WEEKLY: { name: "Weekly mowing", discount: 0.25 },
    BI_WEEKLY: { name: "Bi-Weekly mowing", discount: 0.15 },
    MONTHLY: { name: "Monthly mowing", discount: 0 }
}

const lotSizeRanges = {
    'SMALL': 'Small (up to 5,000 sq ft)',
    'MEDIUM': 'Medium (5,000 - 10,000 sq ft)',
    'LARGE': 'Large (10,000 - 15,000 sq ft)',
    'XLARGE': 'Extra Large (over 15,000 sq ft)'
};

const lotSizeOptions = [
    { value: 'SMALL', label: 'Small (up to 5,000 sq ft)' },
    { value: 'MEDIUM', label: 'Medium (5,000 - 9,000 sq ft)' },
    { value: 'LARGE', label: 'Large (9,000 - 11,000 sq ft)' },
    { value: 'XLARGE', label: 'Extra Large (over 11,000 sq ft)' }
];

const serviceTypes = [
    { value: 'ONE_TIME', label: 'One-time mowing' },
    { value: 'MONTHLY', label: 'Monthly mowing' },
    { value: 'BI_WEEKLY', label: 'Bi-weekly mowing (Save 15%)' },
    { value: 'WEEKLY', label: 'Weekly mowing (Save 25%)' }
];

const inputStyle = {
    width: "100%",
    height: "60px",
    padding: "12px 16px",
    fontSize: "16px",
    lineHeight: "1.2",
    fontFamily: "Be Vietnam Pro",
    fontWeight: "400",
    color: "#999999",
    backgroundColor: "rgba(187, 187, 187, 0.15)",
    border: "none",
    borderRadius: "12px",
    outline: "none",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
}

const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px top 50%",
    backgroundSize: "12px auto",
    paddingRight: "48px",
}

interface QuoteCalculatorProps {
    onPriceChange?: (price: number) => void;
    onServiceChange?: (service: string) => void;
}

export function QuoteCalculator({ onPriceChange, onServiceChange }: QuoteCalculatorProps) {
    const [formData, setFormData] = React.useState({
        address: "",
        lotSize: "",
        service: "ONE_TIME",
        price: null,
        recurring: false,
        phone: "",
        quoteId: null
    })
    const [priceDisplay, setPriceDisplay] = React.useState("")
    const [error, setError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false)
    const [paymentError, setPaymentError] = React.useState("")

    const handleAddressSelect = async (address) => {
        setIsLoading(true)
        try {
            setFormData(prev => ({
                ...prev,
                address
            }))
        } catch (err) {
            setError(err.message || "Error with address selection")
            setFormData(prev => ({
                ...prev,
                address: ""
            }))
        } finally {
            setIsLoading(false)
        }
    }

    const calculatePrice = (lotSize, service) => {
        if (!lotSize) {
            throw new Error("Invalid lot size")
        }
        
        // New pricing tiers based on lot size
        let basePrice = 40; // Minimum price
        
        if (lotSize === 'SMALL') {
            basePrice += 5000 * 0.008;
        } else if (lotSize === 'MEDIUM') {
            basePrice += (5000 * 0.008) + (4000 * 0.006);
        } else if (lotSize === 'LARGE') {
            basePrice += (5000 * 0.008) + (4000 * 0.006) + (2000 * 0.004);
        } else {
            basePrice += (5000 * 0.008) + (4000 * 0.006) + (2000 * 0.004) + (10000 * 0.002);
        }
        
        // Apply discount if applicable
        const serviceConfig = SERVICES[service]
        if (!serviceConfig) {
            throw new Error("Invalid service selected")
        }
        
        const price = Math.round(basePrice)
        
        if (serviceConfig.discount > 0) {
            return Math.round(price * (1 - serviceConfig.discount))
        }
        
        return price
    }

    const handleLotSizeChange = (e) => {
        const value = e.target.value
        setFormData(prev => ({ ...prev, lotSize: value }))
        if (value && formData.service) {
            getQuote(value, formData.service)
        }
    };

    const handleServiceChange = (e) => {
        const value = e.target.value
        setFormData(prev => ({ ...prev, service: value }))
        onServiceChange?.(value)
        if (formData.lotSize && value) {
            getQuote(formData.lotSize, value)
        }
    }

    const getQuote = async (lotSize, service) => {
        try {
            setIsLoading(true)
            setError("")
            
            // Calculate price locally
            const calculatedPrice = calculatePrice(lotSize, service)
            
            // Store all quote data in localStorage
            const quoteData = {
                price: calculatedPrice,
                service_type: service,
                lot_size: lotSize,
                address: formData.address,
                phone: formData.phone
            }
            
            localStorage.setItem('quoteData', JSON.stringify(quoteData))
            
            // Update state
            setPriceDisplay(`$${calculatedPrice}`)
            setFormData(prev => ({ 
                ...prev, 
                price: calculatedPrice,
                service: service,
                lotSize: lotSize
            }))

            if (onPriceChange) onPriceChange(calculatedPrice)
            
        } catch (err) {
            console.error("Quote error:", err)
            setError("Failed to calculate quote. Please try again.")
            setPriceDisplay("")
            setFormData(prev => ({ 
                ...prev, 
                price: null
            }))
            localStorage.removeItem('quoteData')
        } finally {
            setIsLoading(false)
        }
    };

    const handlePayment = async () => {
        setIsProcessingPayment(true)
        setPaymentError("")
        
        try {
            const response = await fetch('https://lawn-peak-api.onrender.com/create-setup-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    price: formData.price,
                    service_type: formData.service,
                    address: formData.address,
                    lot_size: formData.lotSize,
                    phone: formData.phone,
                    return_url: window.location.origin + '/dashboard'
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to setup payment method')
            }

            const data = await response.json()
            
            if (data.setupIntentUrl) {
                window.location.href = data.setupIntentUrl
            } else {
                throw new Error('No setup URL received')
            }
        } catch (err) {
            console.error('Setup error:', err)
            setPaymentError(err.message || 'Failed to setup payment method. Please try again.')
        } finally {
            setIsProcessingPayment(false)
        }
    }

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <form onSubmit={(e) => e.preventDefault()}>
                <AddressInput
                    value={formData.address}
                    onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                    onSelect={handleAddressSelect}
                    style={{
                        input: inputStyle
                    }}
                />

                <select
                    value={formData.lotSize}
                    onChange={handleLotSizeChange}
                    style={{ ...selectStyle, marginTop: "16px" }}
                >
                    <option value="" style={{ color: "#999999" }}>Select Lot Size</option>
                    {lotSizeOptions.map(option => (
                        <option key={option.value} value={option.value} style={{ color: "#999999" }}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select 
                    value={formData.service}
                    onChange={handleServiceChange}
                    style={{ ...selectStyle, marginTop: "16px" }}
                >
                    <option value="" style={{ color: "#999999" }}>Select a service frequency...</option>
                    {Object.entries(SERVICES).map(([value, service]) => (
                        <option key={value} value={value} style={{ color: "#999999" }}>
                            {service.name}
                        </option>
                    ))}
                </select>

                <input
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ ...inputStyle, marginTop: "16px" }}
                />
            </form>

            {error && (
                <div style={{
                    color: "#e53e3e",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(229, 62, 62, 0.1)",
                    marginTop: "8px",
                    fontSize: "14px",
                    animation: "fadeIn 0.3s ease-out"
                }}>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div style={{
                    textAlign: "center",
                    padding: "16px",
                    color: "#718096"
                }}>
                    Calculating price...
                </div>
            ) : formData.price && !isLoading && (
                <>
                    <div className="price-container">
                        <div className="price-title">Service Price</div>
                        <div className="price-amount">${formData.price}</div>
                        {(formData.service === 'WEEKLY' || formData.service === 'BI_WEEKLY') && (
                            <div className="savings-badge">
                                Save {formData.service === 'WEEKLY' ? '25%' : '15%'}
                            </div>
                        )}
                        <div style={{
                            fontSize: "14px",
                            color: "#666",
                            marginTop: "8px",
                            textAlign: "center"
                        }}>
                            You will only be charged after the service is completed
                        </div>
                    </div>
                    
                    {formData.address && formData.lotSize && formData.service && formData.phone ? (
                        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <button
                                onClick={handlePayment}
                                disabled={isProcessingPayment}
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    backgroundColor: "#FFC043",
                                    border: "none",
                                    borderRadius: "12px",
                                    color: "#000",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    cursor: isProcessingPayment ? "not-allowed" : "pointer",
                                    opacity: isProcessingPayment ? 0.7 : 1,
                                }}
                            >
                                {isProcessingPayment ? "Processing..." : "Add Payment Method"}
                            </button>
                            <div style={{
                                fontSize: "14px",
                                color: "#666",
                                textAlign: "center",
                                padding: "0 16px"
                            }}>
                                We'll securely save your card. You'll only be charged ${formData.price} after your lawn is mowed.
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            color: "#718096",
                            padding: "12px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(113, 128, 150, 0.1)",
                            marginTop: "8px",
                            fontSize: "14px",
                            textAlign: "center"
                        }}>
                            Fill in all fields above to proceed with payment
                        </div>
                    )}
                </>
            )}

            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .price-container {
                        background-color: #f7fafc;
                        padding: 24px;
                        border-radius: 12px;
                        text-align: center;
                        animation: fadeIn 0.3s ease-out;
                    }
                    
                    .price-title {
                        color: #4a5568;
                        font-size: 16px;
                        margin-bottom: 8px;
                    }
                    
                    .price-amount {
                        color: #2d3748;
                        font-size: 36px;
                        font-weight: 700;
                    }
                    
                    .savings-badge {
                        display: inline-block;
                        background-color: #48bb78;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 9999px;
                        font-size: 14px;
                        margin-top: 8px;
                    }
                    
                    .price-description {
                        color: #718096;
                        font-size: 14px;
                        margin-top: 8px;
                    }
                `}
            </style>
        </div>
    )
}

export default QuoteCalculator
