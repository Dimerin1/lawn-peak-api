import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// Service configuration
const SERVICES = {
    one_time: { name: "One-time mowing", discount: 0 },
    weekly: { name: "Weekly mowing (30% discount)", discount: 0.30 },
    biweekly: { name: "Bi-Weekly mowing (20% discount)", discount: 0.20 },
    monthly: { name: "Monthly mowing", discount: 0 }
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

function QuoteCalculator() {
    const [formData, setFormData] = React.useState({
        address: "",
        lotSize: "",  
        service: "one_time",
        price: null,
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
                lotSize: result.lot_size_range
            }))
            
            // Reset price display when address changes
            if (formData.service) {
                getQuote(formData.lotSize, formData.service)
            }
        } catch (err) {
            setError(err.message || "Error getting lot size")
            setFormData(prev => ({
                ...prev,
                lotSize: ""
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

    const handleLotSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            lotSize: e.target.value
        }));
        if (formData.service) {
            getQuote(e.target.value, formData.service);
        }
    };

    const handleServiceSelect = async (service) => {
        try {
            setIsLoading(true)
            setError("")

            if (!formData.address) {
                setError("Please enter your address first")
                setPriceDisplay("")
                return
            }

            setFormData(prev => ({
                ...prev,
                service,
                recurring: service !== 'one_time'
            }))

            getQuote(formData.lotSize, service)
        } catch (err) {
            setError(err.message || "Error calculating price")
            setPriceDisplay("")
        } finally {
            setIsLoading(false)
        }
    }

    const getQuote = async (lotSize: string, service: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('https://lawn-peak-api.onrender.com/api/quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lot_size_range: lotSize,
                    service_type: service.toUpperCase()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get quote');
            }

            const data = await response.json();
            setFormData(prev => ({
                ...prev,
                price: data.price
            }));
            setPriceDisplay(`$${data.price}`);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to get quote. Please try again.');
        }
        setIsLoading(false);
    };

    const handleQuoteResponse = (data: any) => {
        setFormData(prev => ({
            ...prev,
            price: data.price,
            lotSizeRange: lotSizeRanges[data.lot_size_range],
            address: data.address
        }));
        setIsLoading(false);
    };

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <AddressInput 
                onAddressSelect={handleAddressSelect} 
                error={error}
                isLoading={isLoading}
            />
            
            {/* Add Lot Size Dropdown */}
            <select
                value={formData.lotSize}
                onChange={handleLotSizeChange}
                style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: "white"
                }}
            >
                <option value="">Select Lot Size</option>
                {lotSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            <select 
                value={formData.service}
                onChange={(e) => {
                    setFormData(prev => ({ ...prev, service: e.target.value }));
                    if (formData.lotSize) {
                        getQuote(formData.lotSize, e.target.value);
                    }
                }}
                style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: "white"
                }}
            >
                <option value="">Select a service frequency...</option>
                {Object.entries(SERVICES).map(([value, service]) => (
                    <option key={value} value={value} style={{ padding: "8px" }}>
                        {service.name}
                    </option>
                ))}
            </select>
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

addPropertyControls(QuoteCalculator, {})
