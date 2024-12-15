import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export function AddressInput({ value, onChange, onSelect }) {
    const [address, setAddress] = React.useState(value || "")
    const [addressError, setAddressError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const autocompleteRef = React.useRef(null)

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            // Add global styles to override Google Places Autocomplete
            const style = document.createElement('style')
            style.textContent = `
                .pac-container {
                    font-family: "Be Vietnam Pro", sans-serif;
                }
                .pac-item {
                    font-family: "Be Vietnam Pro", sans-serif;
                    color: #999999;
                }
                .pac-item-query {
                    font-family: "Be Vietnam Pro", sans-serif;
                    color: #999999;
                }
                .pac-matched {
                    color: #999999;
                }
            `
            document.head.appendChild(style)

            const autocomplete = new google.maps.places.Autocomplete(
                autocompleteRef.current,
                { types: ['address'], componentRestrictions: { country: 'us' } }
            )

            autocomplete.addListener('place_changed', async () => {
                setIsLoading(true)
                setAddressError("")
                
                try {
                    const place = autocomplete.getPlace()
                    if (!place.formatted_address) {
                        throw new Error("Please select a valid address")
                    }

                    setAddress(place.formatted_address)
                    onSelect(place.formatted_address)
                } catch (err) {
                    setAddressError(err.message || "Error selecting address")
                } finally {
                    setIsLoading(false)
                }
            })

            return () => {
                document.head.removeChild(style)
            }
        }
    }, [onSelect])

    return (
        <div style={{ width: "100%" }}>
            <input
                ref={autocompleteRef}
                type="text"
                value={address}
                onChange={(e) => {
                    setAddress(e.target.value)
                    onChange(e.target.value)
                }}
                placeholder="Enter your address"
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
                    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
                }}
                className="address-input"
                disabled={isLoading}
            />
            {addressError && (
                <div style={{ color: "#e53e3e", marginTop: "8px", fontSize: "14px" }}>
                    {addressError}
                </div>
            )}
        </div>
    )
}

// Add global styles for the address input
const style = document.createElement('style')
style.textContent = `
    .address-input::placeholder {
        color: #999999 !important;
        opacity: 0.5 !important;
    }
    .address-input::-webkit-input-placeholder {
        color: #999999 !important;
        opacity: 0.5 !important;
    }
    .address-input::-moz-placeholder {
        color: #999999 !important;
        opacity: 0.5 !important;
    }
    .address-input:-ms-input-placeholder {
        color: #999999 !important;
        opacity: 0.5 !important;
    }
`
document.head.appendChild(style)

AddressInput.defaultProps = {
    value: "",
    onChange: () => {},
    onSelect: () => {},
}

addPropertyControls(AddressInput, {
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "",
    },
    onChange: {
        type: ControlType.Function,
        title: "On Change",
        defaultValue: () => {},
    },
    onSelect: {
        type: ControlType.Function,
        title: "On Select",
        defaultValue: () => {},
    },
})
