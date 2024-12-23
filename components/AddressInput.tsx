import * as React from "react"

interface AddressInputProps {
    value?: string;
    onChange?: (value: string) => void;
    onSelect?: (address: string) => void;
    style?: {
        input?: React.CSSProperties;
    };
}

const loadGoogleMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
        if (window.google?.maps?.places) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
    });
};

export function AddressInput({ value, onChange, onSelect, style }: AddressInputProps) {
    const [address, setAddress] = React.useState(value || "")
    const [addressError, setAddressError] = React.useState("")
    const [isLoadingAddress, setIsLoadingAddress] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null)

    React.useEffect(() => {
        let isMounted = true;
        
        const initAutocomplete = async () => {
            if (!inputRef.current || autocompleteRef.current) return;
            
            try {
                setIsLoadingAddress(true);
                await loadGoogleMapsScript();

                if (!isMounted) return;

                const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                    componentRestrictions: { country: "us" },
                    fields: ["formatted_address", "geometry"],
                    types: ["address"]
                });

                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (place.formatted_address) {
                        setAddress(place.formatted_address);
                        onChange?.(place.formatted_address);
                        onSelect?.(place.formatted_address);
                    }
                });

                autocompleteRef.current = autocomplete;
            } catch (error) {
                console.error("Error initializing autocomplete:", error);
                setAddressError("Error initializing address search");
            } finally {
                if (isMounted) {
                    setIsLoadingAddress(false);
                }
            }
        };

        initAutocomplete();

        return () => {
            isMounted = false;
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [onChange, onSelect]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAddress(value);
        onChange?.(value);
    };

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
                        width: "100%",
                        height: "60px",
                        padding: "12px 16px",
                        fontSize: "16px",
                        lineHeight: "1.2",
                        fontFamily: "Be Vietnam Pro",
                        fontWeight: "400",
                        color: "#333333",
                        backgroundColor: "#F5F5F5",
                        border: "none",
                        borderRadius: "12px",
                        outline: "none",
                        ...style?.input
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
