import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export function AddressInput({ value, onChange, onSelect }) {
    const [address, setAddress] = React.useState(value || "")
    const [addressError, setAddressError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const autocompleteRef = React.useRef(null)

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
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
                    "::placeholder": {
                        color: "#999999",
                        opacity: 1
                    },
                    "&::-webkit-input-placeholder": {
                        color: "#999999",
                        opacity: 1
                    },
                    "&::-moz-placeholder": {
                        color: "#999999",
                        opacity: 1
                    },
                    "&:-ms-input-placeholder": {
                        color: "#999999",
                        opacity: 1
                    }
                }}
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
