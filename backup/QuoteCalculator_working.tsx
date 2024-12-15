// Backup of working QuoteCalculator component - 2024-12-15
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

function QuoteCalculator() {
    const [formData, setFormData] = React.useState({
        address: "",
        lotSize: 0,
        service: "",
        price: 0
    })
    const [priceDisplay, setPriceDisplay] = React.useState("")

    const handleAddressSelect = (data) => {
        setFormData(prev => ({
            ...prev,
            address: data.address,
            lotSize: data.lotSize
        }))
    }

    const handleServiceSelect = (service) => {
        if (!formData.address) {
            setPriceDisplay("Please enter your address first")
            return
        }

        const basePrice = 30
        const pricePerSqFt = 0.01
        const calculatedPrice = Math.round(basePrice + (formData.lotSize * pricePerSqFt))
        
        setFormData(prev => ({
            ...prev,
            service,
            price: calculatedPrice
        }))
        setPriceDisplay(`$${calculatedPrice}`)
    }

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <AddressInput onAddressSelect={handleAddressSelect} />
            <ServiceSelect onServiceSelect={handleServiceSelect} />
            <div style={{ 
                fontSize: "24px", 
                fontWeight: "bold",
                textAlign: "center",
                padding: "16px"
            }}>
                {priceDisplay}
            </div>
        </div>
    )
}

export default QuoteCalculator

function AddressInput({ onAddressSelect }) {
    const [address, setAddress] = React.useState("")
    const inputRef = React.useRef(null)

    React.useEffect(() => {
        if (typeof window !== "undefined" && window.google && inputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: "us" },
                fields: ["formatted_address", "geometry"]
            })

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace()
                if (place.formatted_address) {
                    setAddress(place.formatted_address)
                    onAddressSelect({
                        address: place.formatted_address,
                        lotSize: 5000 // Default lot size in sq ft
                    })
                }
            })
        }
    }, [])

    return (
        <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address..."
            style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                outline: "none",
            }}
        />
    )
}

function ServiceSelect({ onServiceSelect }) {
    return (
        <select 
            onChange={(e) => onServiceSelect(e.target.value)}
            style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                outline: "none",
            }}
        >
            <option value="">Select a service...</option>
            <option value="lawn_mowing">Lawn Mowing (one time)</option>
            <option value="lawn_mowing_recurring">Lawn Mowing (recurring)</option>
        </select>
    )
}
