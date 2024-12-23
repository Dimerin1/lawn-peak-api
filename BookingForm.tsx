import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

// Service configuration
const SERVICES = {
    ONE_TIME: { name: "One-time mowing", discount: 0 },
    WEEKLY: { name: "Weekly mowing", discount: 0.2 },
    BI_WEEKLY: { name: "Bi-Weekly mowing", discount: 0.1 },
    MONTHLY: { name: "Monthly mowing", discount: 0 },
}

const LOT_SIZES = {
    SMALL: { name: "Small (up to 5,000 sq ft)", basePrice: 60 },
    MEDIUM: { name: "Medium (5,000 - 10,000 sq ft)", basePrice: 70 },
    LARGE: { name: "Large (10,000 - 15,000 sq ft)", basePrice: 75 },
    XLARGE: { name: "Extra Large (over 15,000 sq ft)", basePrice: 80 },
}

const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
        if (window.google?.maps?.places) {
            resolve(window.google.maps)
            return
        }

        // Remove any existing Google Maps scripts
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
        if (existingScript) {
            document.head.removeChild(existingScript)
        }

        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDPMxdPl54WLri6kvQl6XNjVzTsXhuzOXw&libraries=places`
        script.async = true
        script.defer = true
        
        script.onload = () => {
            if (window.google?.maps) {
                console.log('Google Maps loaded successfully')
                resolve(window.google.maps)
            } else {
                reject(new Error('Google Maps failed to load'))
            }
        }

        script.onerror = (error) => {
            console.error('Error loading Google Maps:', error)
            reject(error)
        }
        
        document.head.appendChild(script)
    })
}

const calculatePrice = (lotSize, service) => {
    if (!lotSize || !service) {
        return 0
    }

    // Get base price for lot size
    const basePrice = LOT_SIZES[lotSize].basePrice

    // Apply service discount
    const serviceDiscount = SERVICES[service].discount
    const discountedPrice = basePrice * (1 - serviceDiscount)

    // Round to nearest $5
    return Math.round(discountedPrice / 5) * 5
}

const AddressInput = ({ value, onChange, onSelect, style, placeholder }) => {
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const autocompleteRef = React.useRef(null)

    React.useEffect(() => {
        const initializeGoogleMaps = async () => {
            try {
                setIsLoading(true)
                const maps = await loadGoogleMapsScript()
                
                const input = document.getElementById("address-input")
                if (!input) return
                
                const options = {
                    componentRestrictions: { country: "us" },
                    types: ['address'],
                    fields: ['formatted_address', 'geometry']
                }
                
                autocompleteRef.current = new maps.places.Autocomplete(input, options)
                
                autocompleteRef.current.addListener("place_changed", () => {
                    const place = autocompleteRef.current.getPlace()
                    if (place.formatted_address) {
                        onSelect(place.formatted_address)
                    }
                })
                
                setError(null)
            } catch (err) {
                console.error("Error initializing Google Maps:", err)
                setError("Unable to load address search. Please type your address manually.")
            } finally {
                setIsLoading(false)
            }
        }

        initializeGoogleMaps()

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current)
            }
        }
    }, [onSelect])

    return (
        <div style={{ width: "100%" }}>
            <input
                id="address-input"
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    ...style,
                    backgroundColor: isLoading ? "#f0f0f0" : "#F5F5F5",
                    cursor: isLoading ? "wait" : "text"
                }}
                placeholder={isLoading ? "Loading address search..." : placeholder}
                disabled={isLoading}
            />
            {error && (
                <div style={{ 
                    fontSize: "14px", 
                    color: "#dc2626", 
                    marginTop: "4px",
                    paddingLeft: "16px"
                }}>
                    {error}
                </div>
            )}
        </div>
    )
}

const styles = {
    progressBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "0",
        marginBottom: "32px",
        maxWidth: "100%",
    },
    progressStep: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: "500",
        backgroundColor: "#F3F4F6",
        color: "#6B7280",
        zIndex: 1,
    },
    progressLine: {
        flex: 1,
        height: "2px",
        backgroundColor: "#E5E7EB",
        margin: "0 -10px",
    },
    activeStep: {
        backgroundColor: "#FFB74D",
        color: "white",
    },
    completedLine: {
        backgroundColor: "#FFB74D",
    },
    inactiveLine: {
        backgroundColor: "#E5E7EB",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "24px",
    },
    input: {
        width: "100%",
        height: "60px",
        padding: "12px 16px",
        fontSize: "16px",
        lineHeight: "1.2",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: "400",
        color: "#333333",
        backgroundColor: "#F5F5F5",
        border: "none",
        borderRadius: "12px",
        outline: "none",
        transition: "background-color 0.2s ease",
    },
    addressInput: {
        width: "100%",
        height: "60px",
        padding: "12px 16px",
        fontSize: "16px",
        lineHeight: "1.2",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: "400",
        color: "#333333",
        backgroundColor: "#F5F5F5",
        border: "none",
        borderRadius: "12px",
        outline: "none",
        transition: "background-color 0.2s ease",
    },
    select: {
        width: "100%",
        height: "60px",
        padding: "12px 16px",
        fontSize: "16px",
        lineHeight: "1.2",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: "400",
        color: "#333333",
        backgroundColor: "#F5F5F5",
        border: "none",
        borderRadius: "12px",
        outline: "none",
        appearance: "none",
        backgroundImage:
            'url(\'data:image/svg+xml;charset=US-ASCII,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\')',
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 16px center",
    },
    button: {
        width: "100%",
        height: "60px",
        backgroundColor: "#F7C35F",
        color: "#000000",
        border: "none",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s",
    },
    backButton: {
        width: "100%",
        height: "60px",
        backgroundColor: "white",
        color: "#F7C35F",
        border: "1px solid #F7C35F",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
    },
    priceDisplay: {
        padding: "24px",
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        marginBottom: "24px",
    },
    popularBadge: {
        backgroundColor: "#34C759",
        color: "white",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "14px",
        fontWeight: "500",
        display: "inline-block",
        marginBottom: "16px",
    },
    priceSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px",
    },
    originalPrice: {
        fontSize: "24px",
        color: "#666",
        textDecoration: "line-through",
        fontWeight: "500",
    },
    currentPrice: {
        fontSize: "36px",
        color: "#333",
        fontWeight: "600",
    },
    savingsBadge: {
        backgroundColor: "#E8F7ED",
        color: "#34C759",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: "500",
    },
    servicesList: {
        margin: "24px 0",
    },
    serviceItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        color: "#666",
        fontSize: "15px",
    },
    checkmark: {
        color: "#34C759",
    },
    paymentNote: {
        textAlign: "center",
        color: "#666",
        fontSize: "14px",
        marginTop: "16px",
    },
    dateInput: {
        width: "100%",
        height: "60px",
        padding: "12px 16px",
        fontSize: "16px",
        lineHeight: "1.2",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: "400",
        color: "#333333",
        backgroundColor: "#F5F5F5",
        border: "none",
        borderRadius: "12px",
        outline: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    calendarDropdown: {
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        width: "100%",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        padding: "16px",
        zIndex: 1000,
    },
    calendarHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        color: "#333",
        fontWeight: "500",
    },
    navButton: {
        background: "none",
        border: "none",
        padding: "8px",
        cursor: "pointer",
        color: "#666",
        fontSize: "16px",
    },
    calendarWeekdays: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        marginBottom: "8px",
    },
    weekday: {
        textAlign: "center",
        fontSize: "14px",
        color: "#666",
        padding: "4px",
    },
    calendarDays: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
    },
    calendarDay: {
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#333",
        "&:not(.past):hover": {
            backgroundColor: "rgba(76, 175, 80, 0.1)",
        },
        "&.selected": {
            backgroundColor: "#34C759",
            color: "white",
        },
        "&.past": {
            color: "#ccc",
            cursor: "not-allowed",
        },
    },
    detailsSection: {
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "16px",
    },
    detailsHeader: {
        fontWeight: "600",
        fontSize: "14px",
        color: "#4B5563",
        marginBottom: "4px",
    },
    detailsValue: {
        fontSize: "16px",
        color: "#111827",
        marginBottom: "16px",
    },
    locationSection: {
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px",
        backgroundColor: "#F9FAFB",
        borderRadius: "12px",
        marginBottom: "16px",
    },
    locationIcon: {
        color: "#FFB74D",
    },
    reviewsSection: {
        backgroundColor: "#F9FAFB",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
        cursor: "pointer",
        transition: "transform 0.2s ease",
        ":hover": {
            transform: "translateY(-2px)",
        },
    },
    reviewsHeader: {
        fontSize: "16px",
        fontWeight: "500",
        color: "#4B5563",
        marginBottom: "16px",
        textAlign: "center",
    },
    reviewsStats: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "16px",
    },
    reviewsStars: {
        color: "#FFB74D",
        display: "flex",
        gap: "2px",
    },
    reviewsBadges: {
        display: "flex",
        justifyContent: "center",
        gap: "16px",
    },
    badge: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        backgroundColor: "white",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#4B5563",
    },
    mainContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        fontFamily: "Inter, system-ui, sans-serif",
    },
    confirmButton: {
        width: "100%",
        height: "56px",
        backgroundColor: "#F7C35F",
        color: "#000000",
        border: "none",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    detailsContainer: {
        backgroundColor: "transparent",
        padding: "20px 0",
        marginBottom: "16px",
    },
    infoGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    infoRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "0 0 16px 0",
        borderBottom: "1px solid #F3F4F6",
    },
    infoLabel: {
        fontSize: "14px",
        color: "#6B7280",
        flex: "0 0 120px",
    },
    infoValue: {
        fontSize: "15px",
        color: "#111827",
        flex: 1,
        textAlign: "right",
    },
    priceRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0 0 0",
        borderTop: "1px solid #F3F4F6",
    },
    priceLabel: {
        fontSize: "16px",
        fontWeight: "500",
        color: "#111827",
    },
    priceValue: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    discountedPrice: {
        fontSize: "24px",
        fontWeight: "600",
        color: "#111827",
    },
    originalPrice: {
        fontSize: "16px",
        color: "#6B7280",
        textDecoration: "line-through",
    },
    saveTag: {
        fontSize: "13px",
        backgroundColor: "#ECFDF5",
        color: "#059669",
        padding: "2px 8px",
        borderRadius: "4px",
    },
    reviewsSection: {
        backgroundColor: "#F9FAFB",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
        cursor: "pointer",
        transition: "transform 0.2s ease",
        ":hover": {
            transform: "translateY(-2px)",
        },
    },
    reviewsHeader: {
        fontSize: "16px",
        fontWeight: "500",
        color: "#4B5563",
        marginBottom: "16px",
        textAlign: "center",
    },
    reviewsStats: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "16px",
    },
    reviewsStars: {
        color: "#FFB74D",
        display: "flex",
        gap: "2px",
    },
    reviewsBadges: {
        display: "flex",
        justifyContent: "center",
        gap: "16px",
    },
    badge: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        backgroundColor: "white",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#4B5563",
    },
    footer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "center",
    },
    securePayment: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "#666",
        fontSize: "13px",
        marginBottom: "24px",
    },
    questions: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#4B5563",
        fontSize: "14px",
        marginBottom: "16px",
    },
    backButton: {
        width: "100%",
        height: "48px",
        backgroundColor: "transparent",
        color: "#F7C35F",
        border: "none",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    serviceIncludes: {
        marginTop: "16px",
        padding: "16px",
        backgroundColor: "#F9FAFB",
        borderRadius: "12px",
        marginBottom: "8px",
    },
}

const PriceDisplay = ({ price, serviceType, originalPrice }) => {
    const isRecurring = serviceType !== "ONE_TIME"

    const getServiceBadge = () => {
        switch (serviceType) {
            case "ONE_TIME":
                return { text: "Quick Service", color: "#8E44AD" }
            case "WEEKLY":
                return { text: "Best Value", color: "#34C759" }
            case "BI_WEEKLY":
                return { text: "Most Popular", color: "#34C759" }
            case "MONTHLY":
                return { text: "Flexible Service", color: "#2196F3" }
            default:
                return null
        }
    }

    const badge = getServiceBadge()

    return (
        <div
            style={{
                padding: "32px",
                backgroundColor: "white",
                borderRadius: "20px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                fontFamily: "Inter, system-ui, sans-serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {badge && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        backgroundColor: badge.color,
                        color: "white",
                        padding: "6px 30px",
                        fontSize: "13px",
                        fontFamily: "Inter, system-ui, sans-serif",
                        transform: "rotate(0deg)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        zIndex: 1,
                        textAlign: "center",
                        fontWeight: "500",
                        borderTopLeftRadius: "20px",
                        borderBottomRightRadius: "12px",
                    }}
                >
                    {badge.text}
                </div>
            )}

            <div
                style={{
                    marginBottom: "24px",
                    textAlign: "center",
                    position: "relative",
                    zIndex: 2,
                    marginTop: "32px",
                }}
            >
                {isRecurring ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                        }}
                    >
                        {(serviceType === "WEEKLY" ||
                            serviceType === "BI_WEEKLY") && (
                            <span
                                style={{
                                    textDecoration: "line-through",
                                    color: "#666",
                                    fontSize: "24px",
                                    fontFamily: "Inter, system-ui, sans-serif",
                                }}
                            >
                                ${originalPrice}
                            </span>
                        )}
                        <span
                            style={{
                                fontSize: "36px",
                                fontWeight: "600",
                                color: "#333",
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            ${price}
                        </span>
                        {(serviceType === "WEEKLY" ||
                            serviceType === "BI_WEEKLY") && (
                            <span
                                style={{
                                    backgroundColor: "#34C759",
                                    color: "white",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "Inter, system-ui, sans-serif",
                                }}
                            >
                                Save {serviceType === "WEEKLY" ? "20%" : "10%"}
                            </span>
                        )}
                    </div>
                ) : (
                    <div
                        style={{
                            fontSize: "36px",
                            fontWeight: "600",
                            color: "#333",
                            fontFamily: "Inter, system-ui, sans-serif",
                        }}
                    >
                        ${price}
                    </div>
                )}
            </div>

            {(serviceType === "MONTHLY" || serviceType === "ONE_TIME") && (
                <div
                    style={{
                        fontSize: "14px",
                        color: "#34C759",
                        textAlign: "center",
                        fontWeight: "500",
                        marginBottom: "24px",
                        fontFamily: "Inter, system-ui, sans-serif",
                    }}
                >
                    {serviceType === "MONTHLY"
                        ? "Switch to bi-weekly and save 10%"
                        : "Switch to weekly and save 20%"}
                </div>
            )}

            <div
                style={{
                    fontSize: "14px",
                    color: "#666",
                    textAlign: "left",
                    marginBottom: "24px",
                    backgroundColor: "#f8f8f8",
                    padding: "16px",
                    borderRadius: "12px",
                    fontFamily: "Inter, system-ui, sans-serif",
                }}
            >
                <div
                    style={{
                        marginBottom: "8px",
                        fontWeight: "500",
                        color: "#333",
                    }}
                >
                    Service includes:
                </div>
                <div style={{ marginBottom: "8px" }}>✓ Professional mowing</div>
                <div style={{ marginBottom: "8px" }}>✓ Edge trimming</div>
                <div style={{ marginBottom: "8px" }}>
                    ✓ Grass clippings cleanup
                </div>
            </div>
        </div>
    )
}

export default function BookingForm() {
    // Form state
    const [step, setStep] = React.useState(1)
    const [formData, setFormData] = React.useState(() => {
        // Get tomorrow's date
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const formattedDate = tomorrow.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })

        return {
            name: "",
            email: "",
            phone: "",
            address: "",
            lotSize: "",
            service: "",
            startDate: formattedDate,
            price: 0,
            discountedPrice: 0,
        }
    })

    // UI state
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState("")
    const [selectedDate, setSelectedDate] = React.useState(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow
    })
    const [showCalendar, setShowCalendar] = React.useState(false)
    const [showThankYou, setShowThankYou] = React.useState(false)
    const [showCanceled, setShowCanceled] = React.useState(false)
    const [stripePublishableKey, setStripePublishableKey] = React.useState('')

    // Fetch Stripe publishable key
    React.useEffect(() => {
        const fetchStripeKey = async () => {
            try {
                const apiBaseUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "https://lawn-peak-api.onrender.com"
                const response = await fetch(`${apiBaseUrl}/config`)
                const data = await response.json()
                setStripePublishableKey(data.publishableKey)
            } catch (error) {
                console.error('Error fetching Stripe key:', error)
                setError('Failed to load payment configuration')
            }
        }
        fetchStripeKey()
    }, [])

    // Check URL parameters for setup status
    React.useEffect(() => {
        if (typeof window === "undefined") return

        const params = new URLSearchParams(window.location.search)
        const setupStatus = params.get("setup")

        if (setupStatus === "canceled") {
            setShowCanceled(true)
            setShowThankYou(false)
            // Auto-hide after 10 seconds
            const timer = setTimeout(() => {
                setShowCanceled(false)
                window.history.replaceState({}, "", window.location.pathname)
            }, 10000)

            return () => clearTimeout(timer)
        } else if (setupStatus === "success") {
            setShowThankYou(true)
            setShowCanceled(false)
            // Auto-hide after 10 seconds
            const timer = setTimeout(() => {
                setShowThankYou(false)
                window.history.replaceState({}, "", window.location.pathname)
            }, 10000)

            return () => clearTimeout(timer)
        }
    }, [])

    const handleDateSelect = (day) => {
        const newDate = new Date(selectedDate)
        newDate.setDate(day)
        setSelectedDate(newDate)
        setShowCalendar(false)

        // Format the date for display
        const formattedDate = newDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })

        // Update the form data with the formatted date
        setFormData((prev) => ({
            ...prev,
            startDate: formattedDate,
        }))
    }

    const formatDateForDisplay = (date) => {
        return date.toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    // Calculate price whenever service or lot size changes
    React.useEffect(() => {
        if (formData.service && formData.lotSize) {
            const discountedPrice = calculatePrice(
                formData.lotSize,
                formData.service
            )
            setFormData((prev) => ({
                ...prev,
                price: calculatePrice(formData.lotSize, "ONE_TIME"),
                discountedPrice,
            }))
        }
    }, [formData.service, formData.lotSize])

    // Handle payment method
    const handlePayment = async () => {
        setLoading(true)
        setError("")

        try {
            // Use environment variable for API URL
            const apiBaseUrl =
                process.env.NEXT_PUBLIC_API_URL ||
                "https://lawn-peak-api.onrender.com"

            // First submit the quote data to Google Sheets
            const quoteResponse = await fetch(`${apiBaseUrl}/submit-quote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                mode: "cors",
                body: JSON.stringify({
                    name: formData.name || "Not provided",
                    email: formData.email || "Not provided",
                    phone: formData.phone,
                    address: formData.address,
                    lot_size: formData.lotSize,
                    service_type: formData.service,
                    price: formData.discountedPrice, // Don't multiply by 100 for Google Sheets
                    start_date: formData.startDate || "Not provided",
                    submission_date: new Date().toISOString(),
                    payment_status: "Pending",
                    charged_date: "",
                }),
            })

            if (!quoteResponse.ok) {
                const errorText = await quoteResponse.text()
                throw new Error(`Quote submission failed: ${errorText}`)
            }

            // Create setup intent for future payment
            const setupResponse = await fetch(
                `${apiBaseUrl}/create-setup-intent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    mode: "cors",
                    body: JSON.stringify({
                        price: Math.round(formData.discountedPrice * 100), // Keep *100 for Stripe (cents)
                        service_type: formData.service,
                        address: formData.address,
                        lot_size: formData.lotSize,
                        phone: formData.phone,
                        success_url: `${window.location.href}?setup=success`,
                        cancel_url: `${window.location.href}?setup=canceled`,
                        metadata: {
                            name: formData.name,
                            email: formData.email,
                            start_date: formData.startDate,
                            submission_date: new Date().toISOString(),
                            price: formData.discountedPrice, // Store original price in dollars for charging
                            service_type: formData.service,
                            lot_size: formData.lotSize
                        },
                    }),
                }
            )

            if (!setupResponse.ok) {
                const errorText = await setupResponse.text()
                throw new Error(`Setup intent failed: ${errorText}`)
            }

            const data = await setupResponse.json()

            if (!data.setupIntentUrl) {
                throw new Error("No setup URL returned from server")
            }

            // Save form data to localStorage before redirect
            localStorage.setItem(
                "quoteFormData",
                JSON.stringify({
                    ...formData,
                    timestamp: new Date().toISOString(),
                })
            )

            // Push event to dataLayer for Google Tag Manager
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: "payment_method_added",
                    value: formData.discountedPrice,
                    currency: "USD",
                    service_type: formData.service,
                    lot_size: formData.lotSize,
                })
            }

            // Meta Pixel tracking
            if (window.fbq) {
                fbq("track", "InitiateCheckout", {
                    value: formData.discountedPrice,
                    currency: "USD",
                    content_type: "service",
                    content_name: formData.service,
                })
            }

            // Redirect to Stripe Checkout
            window.location.href = data.setupIntentUrl
        } catch (error) {
            console.error("Payment setup error:", error)
            setError(
                error.message || "Failed to set up payment. Please try again."
            )
        } finally {
            setLoading(false)
        }
    }

    const overlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "fadeIn 0.3s ease-out",
        borderRadius: "24px",
    } as const

    const messageStyle = (isSuccess = true) =>
        ({
            backgroundColor: isSuccess ? "#4CAF50" : "#FF9800",
            padding: "2.5rem",
            borderRadius: "24px",
            maxWidth: "500px",
            width: "90%",
            textAlign: "center",
            color: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            animation: "slideUp 0.4s ease-out",
            fontFamily: "Inter, system-ui, sans-serif",
        }) as const

    const titleStyle = {
        fontSize: "32px",
        fontWeight: "600",
        marginBottom: "1.5rem",
        fontFamily: "Inter, system-ui, sans-serif",
        letterSpacing: "-0.02em",
    } as const

    const textStyle = {
        fontSize: "18px",
        lineHeight: "1.6",
        marginBottom: "1.5rem",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: "400",
        opacity: "0.95",
    } as const

    const buttonStyle = (isPrimary = true) =>
        ({
            marginTop: "0.5rem",
            padding: "12px 24px",
            backgroundColor: isPrimary ? "white" : "transparent",
            border: isPrimary ? "none" : "2px solid white",
            borderRadius: "12px",
            cursor: "pointer",
            color: isPrimary ? "#FF9800" : "white",
            fontWeight: "600",
            fontSize: "16px",
            transition: "transform 0.2s ease",
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: isPrimary ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none",
            ":hover": {
                transform: "translateY(-1px)",
                boxShadow: isPrimary
                    ? "0 4px 12px rgba(0, 0, 0, 0.15)"
                    : "none",
            },
            marginLeft: !isPrimary ? "12px" : "0",
        }) as const

    const handleContactClick = () => {
        window.location.href = "tel:+14075452322"
    }

    const handleTryAgainClick = () => {
        setShowCanceled(false)
        window.history.replaceState({}, "", window.location.pathname)
    }

    const handleReviewsClick = () => {
        const reviewsSection = document.querySelector("#reviews")
        if (reviewsSection) {
            reviewsSection.scrollIntoView({ behavior: "smooth" })
            setTimeout(() => {
                setShowCanceled(false)
                window.history.replaceState({}, "", window.location.pathname)
            }, 1000)
        }
    }

    return (
        <>
            <div style={styles.progressBar}>
                {[1, 2, 3].map((num) => (
                    <React.Fragment key={num}>
                        <div
                            style={{
                                ...styles.progressStep,
                                ...(step >= num ? styles.activeStep : {}),
                            }}
                        >
                            {num}
                        </div>
                        {num < 3 && (
                            <div
                                style={{
                                    ...styles.progressLine,
                                    ...(step > num
                                        ? styles.completedLine
                                        : styles.inactiveLine),
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h2
                            style={{
                                fontSize: "24px",
                                fontWeight: "600",
                                marginBottom: "24px",
                                textAlign: "center",
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            Your Information
                        </h2>
                        <div style={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                style={styles.input}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                    }))
                                }
                                style={styles.input}
                            />
                            <input
                                type="tel"
                                placeholder="Phone"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        phone: e.target.value,
                                    }))
                                }
                                style={styles.input}
                            />
                        </div>
                        <button
                            onClick={() => {
                                if (
                                    !formData.name ||
                                    !formData.email ||
                                    !formData.phone
                                ) {
                                    setError("Please fill in all fields")
                                    return
                                }
                                setError("")
                                setStep(2)
                            }}
                            style={styles.button}
                        >
                            Next Step
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h2
                            style={{
                                fontSize: "24px",
                                fontWeight: "600",
                                marginBottom: "24px",
                                textAlign: "center",
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            Service Details
                        </h2>
                        <div style={styles.inputGroup}>
                            <AddressInput
                                value={formData.address}
                                onChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        address: value,
                                    }))
                                }
                                onSelect={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        address: value,
                                    }))
                                }
                                style={styles.addressInput}
                                placeholder="Enter your address"
                            />
                            <select
                                value={formData.lotSize}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        lotSize: e.target.value,
                                    }))
                                }
                                style={styles.select}
                            >
                                <option value="">Select lot size</option>
                                {Object.entries(LOT_SIZES).map(
                                    ([key, { name }]) => (
                                        <option key={key} value={key}>
                                            {name}
                                        </option>
                                    )
                                )}
                            </select>
                            <select
                                value={formData.service}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        service: e.target.value,
                                    }))
                                }
                                style={styles.select}
                            >
                                <option value="">
                                    Select service frequency
                                </option>
                                {Object.entries(SERVICES).map(
                                    ([key, { name }]) => (
                                        <option key={key} value={key}>
                                            {name}
                                        </option>
                                    )
                                )}
                            </select>

                            {formData.lotSize && formData.service && (
                                <div
                                    className="date-input-container"
                                    style={{ position: "relative" }}
                                >
                                    <div
                                        style={styles.dateInput}
                                        onClick={() =>
                                            setShowCalendar(!showCalendar)
                                        }
                                    >
                                        <span>
                                            {selectedDate
                                                ? formatDateForDisplay(
                                                      selectedDate
                                                  )
                                                : "Select preferred start date"}
                                        </span>
                                        <span>📅</span>
                                    </div>
                                    {showCalendar && (
                                        <div style={styles.calendarDropdown}>
                                            <div style={styles.calendarHeader}>
                                                <button
                                                    onClick={() => {
                                                        const newDate =
                                                            new Date(
                                                                selectedDate
                                                            )
                                                        newDate.setMonth(
                                                            newDate.getMonth() -
                                                                1
                                                        )
                                                        setSelectedDate(newDate)
                                                    }}
                                                    style={styles.navButton}
                                                >
                                                    ←
                                                </button>
                                                <div>
                                                    {selectedDate.toLocaleString(
                                                        "en-US",
                                                        {
                                                            month: "long",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newDate =
                                                            new Date(
                                                                selectedDate
                                                            )
                                                        newDate.setMonth(
                                                            newDate.getMonth() +
                                                                1
                                                        )
                                                        setSelectedDate(newDate)
                                                    }}
                                                    style={styles.navButton}
                                                >
                                                    →
                                                </button>
                                            </div>
                                            <div
                                                style={styles.calendarWeekdays}
                                            >
                                                {[
                                                    "Sun",
                                                    "Mon",
                                                    "Tue",
                                                    "Wed",
                                                    "Thu",
                                                    "Fri",
                                                    "Sat",
                                                ].map((day) => (
                                                    <div
                                                        key={day}
                                                        style={styles.weekday}
                                                    >
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={styles.calendarDays}>
                                                {Array.from(
                                                    {
                                                        length: new Date(
                                                            selectedDate.getFullYear(),
                                                            selectedDate.getMonth() +
                                                                1,
                                                            0
                                                        ).getDate(),
                                                    },
                                                    (_, i) => i + 1
                                                ).map((day) => {
                                                    const date = new Date(
                                                        selectedDate.getFullYear(),
                                                        selectedDate.getMonth(),
                                                        day
                                                    )
                                                    const today = new Date()
                                                    today.setHours(0, 0, 0, 0)
                                                    const isPast = date < today
                                                    const isSelected =
                                                        day ===
                                                            selectedDate.getDate() &&
                                                        selectedDate.getMonth() ===
                                                            date.getMonth() &&
                                                        selectedDate.getFullYear() ===
                                                            date.getFullYear()

                                                    return (
                                                        <div
                                                            key={day}
                                                            style={{
                                                                ...styles.calendarDay,
                                                                backgroundColor:
                                                                    isSelected
                                                                        ? "#34C759"
                                                                        : "transparent",
                                                                color: isPast
                                                                    ? "#ccc"
                                                                    : isSelected
                                                                      ? "white"
                                                                      : "#333",
                                                                cursor: isPast
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                            }}
                                                            onClick={() =>
                                                                !isPast &&
                                                                handleDateSelect(
                                                                    day
                                                                )
                                                            }
                                                        >
                                                            {day}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {formData.lotSize && formData.service && (
                            <div style={{ marginBottom: "32px" }}>
                                <PriceDisplay
                                    price={formData.discountedPrice}
                                    serviceType={formData.service}
                                    originalPrice={formData.price}
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "16px" }}>
                            <button
                                onClick={() => setStep(1)}
                                style={styles.backButton}
                            >
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    if (
                                        !formData.address ||
                                        !formData.lotSize ||
                                        !formData.service
                                    ) {
                                        setError("Please fill in all fields")
                                        return
                                    }
                                    setError("")
                                    setStep(3)
                                }}
                                style={styles.button}
                            >
                                Next Step
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                        <h2
                            style={{
                                fontSize: "24px",
                                fontWeight: "600",
                                marginBottom: "32px",
                                textAlign: "center",
                                color: "#111827",
                            }}
                        >
                            Confirm Your Booking
                        </h2>

                        {/* Details Grid */}
                        <div
                            style={{
                                display: "grid",
                                gap: "20px",
                                marginBottom: "32px",
                                background: "#F9FAFB",
                                padding: "24px",
                                borderRadius: "16px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                    >
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span
                                        style={{
                                            color: "#4B5563",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Location
                                    </span>
                                </div>
                                <strong
                                    style={{
                                        textAlign: "right",
                                        maxWidth: "60%",
                                        color: "#111827",
                                        fontSize: "14px",
                                    }}
                                >
                                    {formData.address}
                                </strong>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                    >
                                        <path d="M21 6H3M21 12H3M21 18H3" />
                                    </svg>
                                    <span
                                        style={{
                                            color: "#4B5563",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Lot Size
                                    </span>
                                </div>
                                <strong
                                    style={{
                                        color: "#111827",
                                        fontSize: "14px",
                                    }}
                                >
                                    {LOT_SIZES[formData.lotSize]?.name}
                                </strong>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                    >
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                    <span
                                        style={{
                                            color: "#4B5563",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Service
                                    </span>
                                </div>
                                <strong
                                    style={{
                                        color: "#111827",
                                        fontSize: "14px",
                                    }}
                                >
                                    {SERVICES[formData.service]?.name}
                                </strong>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span
                                        style={{
                                            color: "#4B5563",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Start Date
                                    </span>
                                </div>
                                <strong
                                    style={{
                                        color: "#111827",
                                        fontSize: "14px",
                                    }}
                                >
                                    {formatDateForDisplay(selectedDate)}
                                </strong>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    borderTop: "1px solid #E5E7EB",
                                    paddingTop: "16px",
                                    marginTop: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                    >
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    <span
                                        style={{
                                            color: "#4B5563",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Total Price
                                    </span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    {formData.service !== "ONE_TIME" && (
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                textDecoration: "line-through",
                                                color: "#6B7280",
                                                marginRight: "8px",
                                            }}
                                        >
                                            ${formData.price}
                                        </span>
                                    )}
                                    <strong
                                        style={{
                                            fontSize: "20px",
                                            color: "#111827",
                                        }}
                                    >
                                        ${formData.discountedPrice}
                                    </strong>
                                    {formData.service !== "ONE_TIME" && (
                                        <span
                                            style={{
                                                marginLeft: "8px",
                                                backgroundColor: "#DCF7E3",
                                                color: "#059669",
                                                padding: "4px 8px",
                                                borderRadius: "12px",
                                                fontSize: "12px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            Save{" "}
                                            {SERVICES[formData.service]
                                                .discount * 100}
                                            %
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Service Includes */}
                        <div
                            style={{
                                marginBottom: "32px",
                                background: "#F9FAFB",
                                padding: "24px",
                                borderRadius: "16px",
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: "16px",
                                    color: "#111827",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                }}
                            >
                                Service includes:
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gap: "12px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: "#059669",
                                        fontSize: "14px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Professional mowing
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: "#059669",
                                        fontSize: "14px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Edge trimming
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: "#059669",
                                        fontSize: "14px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Grass clippings cleanup
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <button
                            onClick={() => {
                                const reviewsSection =
                                    document.getElementById("reviews")
                                if (reviewsSection) {
                                    reviewsSection.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    })
                                }
                            }}
                            style={{
                                textAlign: "center",
                                marginBottom: "32px",
                                background: "#F9FAFB",
                                padding: "24px",
                                borderRadius: "16px",
                                width: "100%",
                                border: "1px solid #E5E7EB",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                position: "relative",
                                overflow: "hidden",
                                ":hover": {
                                    backgroundColor: "#F3F4F6",
                                    borderColor: "#D1D5DB",
                                    transform: "translateY(-1px)",
                                },
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: "16px",
                                    color: "#111827",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                }}
                            >
                                Not sure yet? See what your neighbors say
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        color: "#F7C35F",
                                        fontSize: "14px",
                                    }}
                                >
                                    ★★★★★
                                </div>
                                <span
                                    style={{
                                        fontWeight: "600",
                                        color: "#111827",
                                        fontSize: "14px",
                                    }}
                                >
                                    4.9/5
                                </span>
                                <span
                                    style={{
                                        color: "#6B7280",
                                        fontSize: "14px",
                                    }}
                                >
                                    from 30,000+ Reviews
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "24px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        color: "#4B5563",
                                        fontSize: "14px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    Local Business
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        color: "#4B5563",
                                        fontSize: "14px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    Verified Reviews
                                </div>
                            </div>
                        </button>

                        {/* Action Buttons */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                            }}
                        >
                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    backgroundColor: "#F7C35F",
                                    color: "#000",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.7 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Confirm Booking
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setStep(2)}
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    backgroundColor: "transparent",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "12px",
                                    color: "#4B5563",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                }}
                            >
                                Back
                            </button>
                        </div>

                        {/* Footer */}
                        <div
                            style={{
                                textAlign: "center",
                                marginTop: "24px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                            }}
                        >
                            <a
                                href="tel:+14075452322"
                                style={{
                                    color: "#111827",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "12px",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "12px",
                                    backgroundColor: "#F9FAFB",
                                    transition: "all 0.2s ease",
                                    ":hover": {
                                        backgroundColor: "#F3F4F6",
                                        borderColor: "#D1D5DB",
                                    },
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                Questions? Call us{" "}
                                <strong>+1 407 545 2322</strong>
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div
                    style={{
                        color: "#DC2626",
                        fontSize: "14px",
                        marginTop: "16px",
                        textAlign: "center",
                    }}
                >
                    {error}
                </div>
            )}

            {showCanceled && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            padding: "32px",
                            borderRadius: "16px",
                            maxWidth: "500px",
                            width: "90%",
                            textAlign: "center",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <h2
                            style={{
                                marginBottom: "16px",
                                fontSize: "24px",
                                fontWeight: "600",
                                color: "#1F2937",
                            }}
                        >
                            Payment Cancelled
                        </h2>
                        <p
                            style={{
                                marginBottom: "24px",
                                color: "#4B5563",
                                fontSize: "16px",
                                lineHeight: "1.5",
                            }}
                        >
                            Your payment setup was cancelled. Would you like to
                            try again or have questions about our service?
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent: "center",
                            }}
                        >
                            <button
                                onClick={() => {
                                    setShowCanceled(false)
                                    window.history.replaceState(
                                        {},
                                        "",
                                        window.location.pathname
                                    )
                                }}
                                style={{
                                    padding: "12px 24px",
                                    backgroundColor: "#F7C35F",
                                    color: "#000",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                }}
                            >
                                Try Again
                            </button>
                            <a
                                href="tel:+14075452322"
                                style={{
                                    padding: "12px 24px",
                                    backgroundColor: "#F3F4F6",
                                    color: "#1F2937",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "500",
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {showThankYou && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            padding: "32px",
                            borderRadius: "16px",
                            maxWidth: "500px",
                            width: "90%",
                            textAlign: "center",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <div
                            style={{
                                width: "48px",
                                height: "48px",
                                backgroundColor: "#34C759",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2
                            style={{
                                marginBottom: "16px",
                                fontSize: "24px",
                                fontWeight: "600",
                                color: "#1F2937",
                            }}
                        >
                            Thank You!
                        </h2>
                        <p
                            style={{
                                marginBottom: "24px",
                                color: "#4B5563",
                                fontSize: "16px",
                                lineHeight: "1.5",
                            }}
                        >
                            Your payment method has been successfully set up.
                            We'll charge your card after the service is
                            completed.
                        </p>
                        <button
                            onClick={() => {
                                setShowThankYou(false)
                                window.history.replaceState(
                                    {},
                                    "",
                                    window.location.pathname
                                )
                            }}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: "#34C759",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "500",
                                cursor: "pointer",
                            }}
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
