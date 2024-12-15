import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export function AddressInput(props) {
    const [address, setAddress] = React.useState("")
    const [suggestions, setSuggestions] = React.useState([])

    const handleAddressChange = (e) => {
        const value = e.target.value
        setAddress(value)
        console.log("Address changed:", value)
        
        // Here we'll add Google Places API integration later
        if (props.onAddressChange) {
            props.onAddressChange(value)
        }
    }

    return (
        <div style={{ width: "100%" }}>
            <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder={props.placeholder || "Enter your address..."}
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
        </div>
    )
}

AddressInput.defaultProps = {
    placeholder: "Enter your address...",
    onAddressChange: () => {},
}

addPropertyControls(AddressInput, {
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Enter your address...",
    },
})
