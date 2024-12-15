import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

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

function QuoteCalculator({ onPriceChange, onServiceChange }) {
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

    const handleAddressSelect = async (address: string) => {
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

    const calculatePrice = (lotSize: string, service: string) => {
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

    const getQuote = async (lotSize: string, service: string) => {
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

    const handlePaymentSetup = async () => {
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
                    phone: formData.phone
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to set up payment method')
            }

            const data = await response.json()
            
            // Store customer ID in localStorage for later use
            localStorage.setItem('lawn_peak_customer_id', data.customerId)
            
            // Redirect to Stripe's hosted payment method setup page
            window.location.href = `https://checkout.stripe.com/setup/${data.clientSecret}`
        } catch (err) {
            console.error('Payment setup error:', err)
            setPaymentError(err.message || 'Failed to set up payment method. Please try again.')
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
                        <div className="price-title">Estimated Price</div>
                        <div className="price-amount">${formData.price}</div>
                        {(formData.service === 'WEEKLY' || formData.service === 'BI_WEEKLY') && (
                            <div className="savings-badge">
                                Save {formData.service === 'WEEKLY' ? '25%' : '15%'}
                            </div>
                        )}
                    </div>
                    
                    {formData.address && formData.lotSize && formData.service && formData.phone ? (
                        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <button
                                onClick={handlePaymentSetup}
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
                                {isProcessingPayment ? "Processing..." : "Save Payment Method"}
                            </button>
                            
                            <div style={{
                                textAlign: "center",
                                color: "#718096",
                                fontSize: "14px",
                                marginTop: "8px"
                            }}>
                                Your card will not be charged until after the service is completed
                            </div>
                            
                            {paymentError && (
                                <div style={{
                                    color: "#e53e3e",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    backgroundColor: "rgba(229, 62, 62, 0.1)",
                                    marginTop: "8px",
                                    fontSize: "14px"
                                }}>
                                    {paymentError}
                                </div>
                            )}
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

QuoteCalculator.defaultProps = {
    onPriceChange: () => {},
    onServiceChange: () => {}
}

addPropertyControls(QuoteCalculator, {
    onPriceChange: {
        type: ControlType.EventHandler
    },
    onServiceChange: {
        type: ControlType.EventHandler
    }
})

function AddressInput({ value, onChange, onSelect, style }) {
    const [address, setAddress] = React.useState("")
    const [addressError, setAddressError] = React.useState("")
    const [isLoadingAddress, setIsLoadingAddress] = React.useState(false)
    const inputRef = React.useRef(null)

    React.useEffect(() => {
        if (typeof window !== "undefined" && window.google && inputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: "us" },
                fields: ["formatted_address", "geometry"]
            })

            autocomplete.addListener("place_changed", async () => {
                try {
                    setIsLoadingAddress(true)
                    setAddressError("")
                    
                    const place = autocomplete.getPlace()
                    if (!place.formatted_address) {
                        throw new Error("Invalid address selected")
                    }

                    setAddress(place.formatted_address)
                    onSelect(place.formatted_address)
                } catch (err) {
                    setAddressError(err.message || "Error selecting address")
                } finally {
                    setIsLoadingAddress(false)
                }
            })
        }
    }, [])

    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative" }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter your address..."
                    disabled={isLoadingAddress}
                    style={{
                        ...style.input,
                        "::placeholder": {
                            color: "#999999",
                            opacity: 1
                        }
                    }}
                />
                {isLoadingAddress && (
                    <div style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#718096",
                        fontSize: "14px"
                    }}>
                        Loading...
                    </div>
                )}
            </div>
            {addressError && (
                <div style={{ 
                    color: "#e53e3e", 
                    fontSize: "14px",
                    marginTop: "4px",
                    paddingLeft: "12px"
                }}>
                    {addressError}
                </div>
            )}
        </div>
    )
}

export default QuoteCalculator
