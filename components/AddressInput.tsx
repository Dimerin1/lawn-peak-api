import * as React from "react"

interface AddressInputProps {
    value?: string;
    onChange?: (value: string) => void;
    onSelect?: (address: string) => void;
    style?: {
        input?: React.CSSProperties;
    };
}

export function AddressInput({ value, onChange, onSelect, style }: AddressInputProps) {
    const [address, setAddress] = React.useState(value || "")
    const [addressError, setAddressError] = React.useState("")
    const [isLoadingAddress, setIsLoadingAddress] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

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
                    onSelect?.(place.formatted_address)
                } catch (err) {
                    setAddressError(err instanceof Error ? err.message : "Error selecting address")
                } finally {
                    setIsLoadingAddress(false)
                }
            })
        }
    }, [onSelect])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setAddress(value)
        onChange?.(value)
    }

    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative" }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={address}
                    onChange={handleChange}
                    placeholder="Enter your address..."
                    disabled={isLoadingAddress}
                    style={{
                        ...style?.input,
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
