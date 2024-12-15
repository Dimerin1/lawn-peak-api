import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// Service configuration
const SERVICES = {
    one_time: { name: "One-time mowing", discount: 0 },
    weekly: { name: "Weekly mowing (30% discount)", discount: 0.30 },
    biweekly: { name: "Bi-Weekly mowing (20% discount)", discount: 0.20 },
    monthly: { name: "Monthly mowing", discount: 0 }
}

function QuoteCalculator() {
    const [formData, setFormData] = React.useState({
        address: "",
        lotSize: 0,
        service: "",
        price: 0,
        recurring: false
    })
    const [priceDisplay, setPriceDisplay] = React.useState("")
    const [error, setError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    const handleAddressSelect = async (data) => {
        try {
            setIsLoading(true)
            setError("")
            
            // Make API call to get lot size
            const response = await fetch('https://lawn-peak-api.onrender.com/api/quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: data.address
                })
            })
            
            if (!response.ok) {
                throw new Error('Failed to get lot size')
            }
            
            const result = await response.json()
            
            setFormData(prev => ({
                ...prev,
                address: data.address,
                lotSize: result.lot_size
            }))
            
            // Reset price display when address changes
            if (formData.service) {
                handleServiceSelect(formData.service)
            }
        } catch (err) {
            setError(err.message || "Error getting lot size")
            setFormData(prev => ({
                ...prev,
                lotSize: 0
            }))
        } finally {
            setIsLoading(false)
        }
    }

    const calculatePrice = (lotSize: number, service: string) => {
        if (lotSize <= 0) {
            throw new Error("Invalid lot size")
        }
        
        // New pricing tiers based on lot size
        let basePrice = 40; // Minimum price
        
        if (lotSize <= 5000) {
            basePrice += lotSize * 0.008;
        } else if (lotSize <= 10000) {
            basePrice += (5000 * 0.008) + ((lotSize - 5000) * 0.006);
        } else {
            basePrice += (5000 * 0.008) + (5000 * 0.006) + ((lotSize - 10000) * 0.004);
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

    const handleServiceSelect = async (service) => {
        try {
            setIsLoading(true)
            setError("")

            if (!formData.address) {
                setError("Please enter your address first")
                setPriceDisplay("")
                return
            }

            const calculatedPrice = calculatePrice(formData.lotSize, service)
            const serviceConfig = SERVICES[service]
            
            setFormData(prev => ({
                ...prev,
                service,
                price: calculatedPrice,
                recurring: service !== 'one_time'
            }))

            let displayText = `$${calculatedPrice}`
            if (serviceConfig && serviceConfig.discount > 0) {
                const regularPrice = calculatePrice(formData.lotSize, 'one_time')
                displayText += ` (${Math.round(serviceConfig.discount * 100)}% off $${regularPrice})`
            }
            if (service !== 'one_time') {
                displayText += ' per service'
            }
            
            setPriceDisplay(displayText)
        } catch (err) {
            setError(err.message || "Error calculating price")
            setPriceDisplay("")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <AddressInput 
                onAddressSelect={handleAddressSelect} 
                error={error}
                isLoading={isLoading}
            />
            <ServiceSelect 
                onServiceSelect={handleServiceSelect}
                disabled={!formData.address || isLoading}
            />
            {error && (
                <div style={{ 
                    color: "#e53e3e", 
                    fontSize: "14px",
                    textAlign: "center",
                    padding: "8px",
                    backgroundColor: "#fff5f5",
                    borderRadius: "8px",
                }}>
                    {error}
                </div>
            )}
            {isLoading ? (
                <div style={{ 
                    fontSize: "24px", 
                    fontWeight: "bold",
                    textAlign: "center",
                    padding: "16px",
                    color: "#718096"
                }}>
                    Calculating price...
                </div>
            ) : priceDisplay && (
                <div style={{ 
                    fontSize: "24px", 
                    fontWeight: "bold",
                    textAlign: "center",
                    padding: "16px"
                }}>
                    {priceDisplay}
                </div>
            )}
        </div>
    )
}

export default QuoteCalculator

function AddressInput({ onAddressSelect, error, isLoading }) {
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
                    onAddressSelect({
                        address: place.formatted_address,
                        lotSize: 5000 // Default lot size in sq ft
                    })
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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address..."
                    disabled={isLoading}
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
                        outline: "none"
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

function ServiceSelect({ onServiceSelect, disabled }) {
    return (
        <select 
            onChange={(e) => onServiceSelect(e.target.value)}
            disabled={disabled}
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
                cursor: disabled ? "not-allowed" : "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 16px top 50%",
                backgroundSize: "12px auto",
                paddingRight: "48px"
            }}
        >
            <option value="">Select a service frequency...</option>
            {Object.entries(SERVICES).map(([value, service]) => (
                <option key={value} value={value} style={{ padding: "8px" }}>
                    {service.name}
                </option>
            ))}
        </select>
    )
}

addPropertyControls(QuoteCalculator, {})
