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

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <AddressInput
                value={formData.address}
                onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                onSelect={handleAddressSelect}
                style={{
                    input: {
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
                        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)"
                    }
                }}
            />

            {/* Add global styles for address input placeholder */}
            <style>
                {`
                    input[type="text"]::placeholder {
                        color: #999999 !important;
                        opacity: 1 !important;
                    }
                    input[type="text"]::-webkit-input-placeholder {
                        color: #999999 !important;
                        opacity: 1 !important;
                    }
                    input[type="text"]::-moz-placeholder {
                        color: #999999 !important;
                        opacity: 1 !important;
                    }
                    input[type="text"]:-ms-input-placeholder {
                        color: #999999 !important;
                        opacity: 1 !important;
                    }
                    .pac-container {
                        font-family: "Be Vietnam Pro", sans-serif !important;
                    }
                    .pac-item, .pac-item-query {
                        color: #999999 !important;
                        opacity: 1 !important;
                    }
                `}
            </style>

            {/* Add Lot Size Dropdown */}
            <select
                value={formData.lotSize}
                onChange={handleLotSizeChange}
                style={selectStyle}
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
                style={selectStyle}
            >
                <option value="" style={{ color: "#999999" }}>Select a service frequency...</option>
                {Object.entries(SERVICES).map(([value, service]) => (
                    <option key={value} value={value} style={{ color: "#999999" }}>
                        {service.name}
                    </option>
                ))}
            </select>
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
                <div className="price-container">
                    <div className="price-title">
                        Estimated Price
                    </div>
                    <div className="price-amount">
                        ${formData.price}
                    </div>
                    {(formData.service === 'WEEKLY' || formData.service === 'BI_WEEKLY') && (
                        <div className="savings-badge">
                            Save {formData.service === 'WEEKLY' ? '25%' : '15%'}
                        </div>
                    )}
                    <div className="price-description">
                        {formData.service === 'ONE_TIME' ? 'One-time service' :
                         formData.service === 'BI_WEEKLY' ? 'Bi-weekly service' :
                         formData.service === 'WEEKLY' ? 'Weekly service' :
                         'Monthly service'}
                    </div>
                </div>
            )}
            <style>
                {`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes slideIn {
                        from {
                            transform: translateX(-20px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    .price-container {
                        background: linear-gradient(135deg, #FBB040 0%, #FB8C00 100%);
                        border-radius: 16px;
                        padding: 32px;
                        color: white;
                        box-shadow: 0px 4px 12px rgba(251, 176, 64, 0.2);
                        animation: fadeIn 0.5s ease-out;
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                        margin: 16px 0;
                    }

                    .savings-badge {
                        position: absolute;
                        top: 20px;
                        right: -35px;
                        background: #4CAF50;
                        color: white;
                        padding: 8px 40px;
                        font-size: 16px;
                        font-weight: 600;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        animation: slideIn 0.5s ease-out 0.3s;
                        animation-fill-mode: both;
                        transform: rotate(45deg);
                        text-align: center;
                        width: 150px;
                    }

                    .savings-badge::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(255,255,255,0.1);
                        transform: translateX(-100%);
                        animation: shine 2s infinite;
                    }

                    @keyframes shine {
                        0% {
                            transform: translateX(-100%);
                        }
                        60% {
                            transform: translateX(100%);
                        }
                        100% {
                            transform: translateX(100%);
                        }
                    }

                    .price-container:hover {
                        transform: translateY(-2px);
                        box-shadow: 0px 6px 16px rgba(251, 176, 64, 0.3);
                    }

                    .price-title {
                        font-size: 24px;
                        font-weight: 600;
                        margin-bottom: 16px;
                        animation: slideIn 0.5s ease-out;
                    }

                    .price-amount {
                        font-size: 48px;
                        font-weight: 700;
                        margin-bottom: 16px;
                        animation: slideIn 0.5s ease-out 0.1s;
                        animation-fill-mode: both;
                        letter-spacing: -0.02em;
                    }

                    .price-description {
                        font-size: 18px;
                        opacity: 0.9;
                        animation: slideIn 0.5s ease-out 0.2s;
                        animation-fill-mode: both;
                        font-weight: 500;
                    }

                    .input-container {
                        transition: all 0.3s ease;
                    }

                    .input-container:focus-within {
                        transform: translateY(-2px);
                    }

                    select, input {
                        transition: all 0.3s ease;
                    }

                    select:hover, input:hover {
                        background-color: rgba(187, 187, 187, 0.2) !important;
                    }
                `}
            </style>
            <div className="input-container">
                <input
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
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
                        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)"
                    }}
                />
            </div>
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
