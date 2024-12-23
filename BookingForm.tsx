import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

// Service configuration
const SERVICES = {
    ONE_TIME: { name: "One-time mowing", discount: 0 },
    WEEKLY: { name: "Weekly mowing", discount: 0.20 },
    BI_WEEKLY: { name: "Bi-Weekly mowing", discount: 0.10 },
    MONTHLY: { name: "Monthly mowing", discount: 0 }
}

const LOT_SIZES = {
    SMALL: { name: 'Small (up to 5,000 sq ft)', basePrice: 60 },
    MEDIUM: { name: 'Medium (5,000 - 10,000 sq ft)', basePrice: 70 },
    LARGE: { name: 'Large (10,000 - 15,000 sq ft)', basePrice: 75 },
    XLARGE: { name: 'Extra Large (over 15,000 sq ft)', basePrice: 80 }
};

const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.google?.maps?.places) {
            resolve()
            return
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => {
            if (window.google?.maps?.places) {
                resolve()
            } else {
                reject(new Error('Google Maps Places API not loaded'))
            }
        }
        script.onerror = () => reject(new Error('Failed to load Google Maps script'))
        document.head.appendChild(script)
    })
};

const calculatePrice = (lotSize, service) => {
    if (!lotSize || !service) {
        return 0;
    }
    
    // Get base price for lot size
    const basePrice = LOT_SIZES[lotSize].basePrice;
    
    // Apply service discount
    const serviceDiscount = SERVICES[service].discount;
    const discountedPrice = basePrice * (1 - serviceDiscount);
    
    // Round to nearest $5
    return Math.round(discountedPrice / 5) * 5;
};

const AddressInput = ({ value, onChange, onSelect, style, placeholder }) => {
    const [autocomplete, setAutocomplete] = React.useState(null)

    React.useEffect(() => {
        if (typeof window !== 'undefined' && !autocomplete) {
            const input = document.getElementById('address-input')
            const options = {
                componentRestrictions: { country: 'us' }
            }
            const autoComplete = new window.google.maps.places.Autocomplete(input, options)
            autoComplete.addListener('place_changed', () => {
                const place = autoComplete.getPlace()
                if (place.formatted_address) {
                    onSelect(place.formatted_address)
                }
            })
            setAutocomplete(autoComplete)
        }
    }, [onSelect])

    return (
        <input
            id="address-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={style}
            placeholder={placeholder}
        />
    )
}

const styles = {
    container: {
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        fontFamily: "Be Vietnam Pro"
    },
    header: {
        textAlign: "center",
        marginBottom: "32px"
    },
    title: {
        fontSize: "24px",
        fontWeight: "600",
        marginBottom: "16px"
    },
    subtitle: {
        color: "#666",
        fontSize: "16px",
        lineHeight: "1.5"
    },
    progressBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px"
    },
    stepCircle: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "600",
        fontSize: "16px"
    },
    stepLine: {
        flex: 1,
        height: "2px",
        margin: "0 8px"
    },
    formContainer: {
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "32px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginBottom: "24px"
    },
    input: {
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
        outline: "none"
    },
    select: {
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
        appearance: "none",
        backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 9L12 15L18 9\" stroke=\"%23333\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 16px center"
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
        transition: "background-color 0.2s"
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
        cursor: "pointer"
    },
    priceDisplay: {
        padding: "24px",
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        marginBottom: "24px"
    },
    popularBadge: {
        backgroundColor: "#34C759",
        color: "white",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "14px",
        fontWeight: "500",
        display: "inline-block",
        marginBottom: "16px"
    },
    priceSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px"
    },
    originalPrice: {
        fontSize: "24px",
        color: "#666",
        textDecoration: "line-through",
        fontWeight: "500"
    },
    currentPrice: {
        fontSize: "36px",
        color: "#333",
        fontWeight: "600"
    },
    savingsBadge: {
        backgroundColor: "#E8F7ED",
        color: "#34C759",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: "500"
    },
    servicesList: {
        margin: "24px 0"
    },
    serviceItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        color: "#666",
        fontSize: "15px"
    },
    checkmark: {
        color: "#34C759"
    },
    paymentNote: {
        textAlign: "center",
        color: "#666",
        fontSize: "14px",
        marginTop: "16px"
    },
    dateInput: {
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
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
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
        zIndex: 1000
    },
    calendarHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        color: "#333",
        fontWeight: "500"
    },
    navButton: {
        background: "none",
        border: "none",
        padding: "8px",
        cursor: "pointer",
        color: "#666",
        fontSize: "16px"
    },
    calendarWeekdays: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        marginBottom: "8px"
    },
    weekday: {
        textAlign: "center",
        fontSize: "14px",
        color: "#666",
        padding: "4px"
    },
    calendarDays: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px"
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
            backgroundColor: "rgba(76, 175, 80, 0.1)"
        },
        "&.selected": {
            backgroundColor: "#34C759",
            color: "white"
        },
        "&.past": {
            color: "#ccc",
            cursor: "not-allowed"
        }
    }
}

const PriceDisplay = ({ price, serviceType, originalPrice }) => {
    const isRecurring = serviceType !== 'ONE_TIME'
    
    const getServiceBadge = () => {
        switch(serviceType) {
            case 'ONE_TIME':
                return { text: 'Quick Service', color: '#8E44AD' }
            case 'WEEKLY':
                return { text: 'Best Value', color: '#34C759' }
            case 'BI_WEEKLY':
                return { text: 'Most Popular', color: '#34C759' }
            case 'MONTHLY':
                return { text: 'Flexible Service', color: '#2196F3' }
            default:
                return null
        }
    }

    const badge = getServiceBadge()

    return (
        <div style={{
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            fontFamily: 'Be Vietnam Pro',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {badge && (
                <div style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    backgroundColor: badge.color,
                    color: 'white',
                    padding: '6px 30px',
                    fontSize: '13px',
                    fontFamily: 'Be Vietnam Pro',
                    transform: 'rotate(0deg)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 1,
                    textAlign: 'center',
                    fontWeight: '500',
                    borderTopLeftRadius: '20px',
                    borderBottomRightRadius: '12px'
                }}>
                    {badge.text}
                </div>
            )}
            
            <div style={{ 
                marginBottom: '24px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2,
                marginTop: '32px'
            }}>
                {isRecurring ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        {(serviceType === 'WEEKLY' || serviceType === 'BI_WEEKLY') && (
                            <span style={{ textDecoration: 'line-through', color: '#666', fontSize: '24px', fontFamily: 'Be Vietnam Pro' }}>${originalPrice}</span>
                        )}
                        <span style={{ fontSize: '36px', fontWeight: '600', color: '#333', fontFamily: 'Be Vietnam Pro' }}>${price}</span>
                        {(serviceType === 'WEEKLY' || serviceType === 'BI_WEEKLY') && (
                            <span style={{ 
                                backgroundColor: '#34C759', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '6px', 
                                fontSize: '14px',
                                fontFamily: 'Be Vietnam Pro',
                            }}>
                                Save {serviceType === 'WEEKLY' ? '20%' : '10%'}
                            </span>
                        )}
                    </div>
                ) : (
                    <div style={{ fontSize: '36px', fontWeight: '600', color: '#333', fontFamily: 'Be Vietnam Pro' }}>
                        ${price}
                    </div>
                )}
            </div>

            {(serviceType === 'MONTHLY' || serviceType === 'ONE_TIME') && (
                <div style={{ 
                    fontSize: '14px', 
                    color: '#34C759', 
                    textAlign: 'center',
                    fontWeight: '500',
                    marginBottom: '24px',
                    fontFamily: 'Be Vietnam Pro',
                }}>
                    {serviceType === 'MONTHLY' 
                        ? 'Switch to bi-weekly and save 10%'
                        : 'Switch to weekly and save 20%'
                    }
                </div>
            )}

            <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                textAlign: 'left',
                marginBottom: '24px',
                backgroundColor: '#f8f8f8',
                padding: '16px',
                borderRadius: '12px',
                fontFamily: 'Be Vietnam Pro',
            }}>
                <div style={{ marginBottom: '8px', fontWeight: '500', color: '#333' }}>Service includes:</div>
                <div style={{ marginBottom: '8px' }}>✓ Professional mowing</div>
                <div style={{ marginBottom: '8px' }}>✓ Edge trimming</div>
                <div style={{ marginBottom: '8px' }}>✓ Grass clippings cleanup</div>
            </div>
        </div>
    )
}

const ConfirmationDetails = ({ formData, loading, handlePayment }) => {
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const originalPrice = calculatePrice(formData.lotSize, 'ONE_TIME');
    const discountedPrice = calculatePrice(formData.lotSize, formData.service);
    const isRecurring = formData.service !== 'ONE_TIME';
    const discount = SERVICES[formData.service]?.discount || 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom: '32px',
                    paddingBottom: '24px',
                    borderBottom: '1px solid #eee'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F7C35F" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div>
                        <div style={{ 
                            color: '#666',
                            fontSize: '14px',
                            marginBottom: '4px'
                        }}>Service Location</div>
                        <div style={{ 
                            color: '#333',
                            fontSize: '16px',
                            lineHeight: '1.4'
                        }}>{formData.address}</div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px'
                }}>
                    <div>
                        <div style={{ 
                            color: '#666',
                            fontSize: '14px',
                            marginBottom: '4px'
                        }}>Lot Size</div>
                        <div style={{ 
                            color: '#333',
                            fontSize: '15px'
                        }}>{LOT_SIZES[formData.lotSize]?.name}</div>
                    </div>

                    <div>
                        <div style={{ 
                            color: '#666',
                            fontSize: '14px',
                            marginBottom: '4px'
                        }}>Service Type</div>
                        <div style={{ 
                            color: '#333',
                            fontSize: '15px'
                        }}>{SERVICES[formData.service]?.name}</div>
                    </div>

                    <div>
                        <div style={{ 
                            color: '#666',
                            fontSize: '14px',
                            marginBottom: '4px'
                        }}>Start Date</div>
                        <div style={{ 
                            color: '#333',
                            fontSize: '15px'
                        }}>{formatDate(formData.startDate)}</div>
                    </div>

                    <div>
                        <div style={{ 
                            color: '#666',
                            fontSize: '14px',
                            marginBottom: '4px'
                        }}>Total Price</div>
                        <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {isRecurring && discount > 0 && (
                                <span style={{ 
                                    color: '#666',
                                    fontSize: '20px',
                                    textDecoration: 'line-through'
                                }}>${originalPrice}</span>
                            )}
                            <span style={{ 
                                color: '#333',
                                fontSize: '20px',
                                fontWeight: '600'
                            }}>${discountedPrice}</span>
                            {discount > 0 && (
                                <span style={{ 
                                    fontSize: '13px',
                                    backgroundColor: '#34C75910',
                                    color: '#34C759',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}>
                                    Save {discount * 100}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                backgroundColor: '#FAFAFA',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center'
            }}>
                <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #eee'
                }}>
                    <div style={{
                        fontSize: '15px',
                        color: '#666',
                        marginBottom: '16px'
                    }}>
                        Not sure yet? See what your neighbors say
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <a 
                            href="#reviews" 
                            onClick={(e) => {
                                e.preventDefault();
                                document.querySelector('#reviews')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#333',
                                textDecoration: 'none',
                                padding: '12px 20px',
                                backgroundColor: '#F7C35F10',
                                borderRadius: '10px',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="#F7C35F" stroke="#F7C35F" strokeWidth="1.5">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                ))}
                            </div>
                            <span style={{ fontWeight: '600' }}>4.9/5</span>
                            <span style={{ color: '#666' }}>from 200+ Reviews</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12l7 7 7-7"/>
                            </svg>
                        </a>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#666'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#F5F5F5',
                                padding: '6px 12px',
                                borderRadius: '8px'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                                </svg>
                                Local Business
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#F5F5F5',
                                padding: '6px 12px',
                                borderRadius: '8px'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                                Verified Reviews
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '24px',
                    fontStyle: 'italic'
                }}>
                    You will only be charged after the service is completed
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    style={{
                        width: '100%',
                        height: '56px',
                        backgroundColor: '#F7C35F',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(247, 195, 95, 0.3)'
                    }}
                >
                    {loading ? (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                            Processing...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                                <path d="M7 13l3 3 7-7"/>
                            </svg>
                            Confirm Booking
                        </>
                    )}
                </button>

                <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '12px',
                    color: '#666',
                    fontSize: '13px'
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Secure payment powered by Stripe
                </div>
            </div>
        </div>
    );
};

export default function BookingForm() {
    // Form state
    const [step, setStep] = React.useState(1)
    const [mapsLoaded, setMapsLoaded] = React.useState(false)
    const [mapsError, setMapsError] = React.useState(null)

    React.useEffect(() => {
        const loadMaps = async () => {
            try {
                await loadGoogleMapsScript()
                setMapsLoaded(true)
            } catch (err) {
                console.error('Error loading Google Maps:', err)
                setMapsError('Error loading address autocomplete')
            }
        }
        loadMaps()
    }, [])

    const [formData, setFormData] = React.useState(() => {
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return {
            name: "",
            email: "",
            phone: "",
            address: "",
            lotSize: "",
            service: "",
            startDate: formattedDate,
            price: 0,
            discountedPrice: 0
        };
    })

    // UI state
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState("")
    const [selectedDate, setSelectedDate] = React.useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    })
    const [showCalendar, setShowCalendar] = React.useState(false)

    const handleDateSelect = (day) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(day);
        setSelectedDate(newDate);
        setShowCalendar(false);
        
        // Format the date for display
        const formattedDate = newDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update the form data with the formatted date
        setFormData(prev => ({
            ...prev,
            startDate: formattedDate
        }));
    };

    const formatDateForDisplay = (date) => {
        return date.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Calculate price whenever service or lot size changes
    React.useEffect(() => {
        if (formData.service && formData.lotSize) {
            const discountedPrice = calculatePrice(formData.lotSize, formData.service);
            setFormData(prev => ({
                ...prev,
                price: calculatePrice(formData.lotSize, 'ONE_TIME'),
                discountedPrice
            }))
        }
    }, [formData.service, formData.lotSize])

    // Handle payment method
    const handlePayment = async () => {
        setLoading(true);
        setError("");

        try {
            const apiBaseUrl = 'https://lawn-peak-api.onrender.com';  

            // First submit the quote data
            const quoteResponse = await fetch(`${apiBaseUrl}/submit-quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name || 'Not provided',
                    email: formData.email || 'Not provided',
                    phone: formData.phone,
                    address: formData.address,
                    lot_size: formData.lotSize,
                    service_type: formData.service,
                    price: Math.round(formData.price * 100), 
                    start_date: formData.startDate || 'Not provided'
                })
            });

            if (!quoteResponse.ok) {
                const errorText = await quoteResponse.text();
                throw new Error(`Quote submission failed: ${errorText}`);
            }

            // Create setup intent
            const setupResponse = await fetch(`${apiBaseUrl}/create-setup-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    price: Math.round(formData.price * 100), 
                    service_type: formData.service,
                    address: formData.address,
                    lot_size: formData.lotSize,
                    phone: formData.phone,
                    success_url: `${window.location.origin}/success`,
                    cancel_url: `${window.location.origin}/cancel`
                })
            });

            if (!setupResponse.ok) {
                const errorText = await setupResponse.text();
                throw new Error(`Setup intent failed: ${errorText}`);
            }

            const data = await setupResponse.json();
            
            if (!data.setupIntentUrl) {
                throw new Error('No setup URL returned from server');
            }

            // Save form data to localStorage before redirect
            localStorage.setItem('quoteFormData', JSON.stringify({
                ...formData,
                timestamp: new Date().toISOString()
            }));

            // Redirect to Stripe Checkout
            window.location.href = data.setupIntentUrl;

        } catch (error) {
            console.error('Payment setup error:', error);
            setError(error.message || 'Failed to set up payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Progress Bar */}
            <div style={styles.progressBar}>
                {[1, 2, 3].map(num => (
                    <React.Fragment key={num}>
                        <div style={{
                            ...styles.stepCircle,
                            backgroundColor: step >= num ? "#F7C35F" : "#F5F5F5",
                            color: step >= num ? "#000000" : "#666666"
                        }}>
                            {num}
                        </div>
                        {num < 3 && (
                            <div style={{
                                ...styles.stepLine,
                                backgroundColor: step > num ? "#F7C35F" : "#F5F5F5"
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Form Content */}
            <div style={styles.formContainer}>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h2 style={{
                                fontSize: "24px",
                                fontWeight: "600",
                                marginBottom: "24px",
                                textAlign: "center"
                            }}>
                                Your Information
                            </h2>
                            <div style={styles.inputGroup}>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    style={styles.input}
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    style={styles.input}
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone"
                                    value={formData.phone}
                                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    style={styles.input}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (!formData.name || !formData.email || !formData.phone) {
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
                            <h2 style={{
                                fontSize: "24px",
                                fontWeight: "600",
                                marginBottom: "24px",
                                textAlign: "center"
                            }}>
                                Service Details
                            </h2>
                            <div style={styles.inputGroup}>
                                <AddressInput
                                    value={formData.address}
                                    onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                                    onSelect={(value) => setFormData(prev => ({ ...prev, address: value }))}
                                    style={styles.input}
                                    placeholder="Enter your address"
                                />
                                <select
                                    value={formData.lotSize}
                                    onChange={e => setFormData(prev => ({ ...prev, lotSize: e.target.value }))}
                                    style={styles.select}
                                >
                                    <option value="">Select lot size</option>
                                    {Object.entries(LOT_SIZES).map(([key, { name }]) => (
                                        <option key={key} value={key}>{name}</option>
                                    ))}
                                </select>
                                <select
                                    value={formData.service}
                                    onChange={e => setFormData(prev => ({ ...prev, service: e.target.value }))}
                                    style={styles.select}
                                >
                                    <option value="">Select service frequency</option>
                                    {Object.entries(SERVICES).map(([key, { name }]) => (
                                        <option key={key} value={key}>{name}</option>
                                    ))}
                                </select>

                                {formData.lotSize && formData.service && (
                                    <div className="date-input-container" style={{ position: "relative" }}>
                                        <div
                                            style={styles.dateInput}
                                            onClick={() => setShowCalendar(!showCalendar)}
                                        >
                                            <span>{selectedDate ? formatDateForDisplay(selectedDate) : "Select preferred start date"}</span>
                                            <span>📅</span>
                                        </div>
                                        {showCalendar && (
                                            <div style={styles.calendarDropdown}>
                                                <div style={styles.calendarHeader}>
                                                    <button
                                                        onClick={() => {
                                                            const newDate = new Date(selectedDate);
                                                            newDate.setMonth(newDate.getMonth() - 1);
                                                            setSelectedDate(newDate);
                                                        }}
                                                        style={styles.navButton}
                                                    >←</button>
                                                    <div>
                                                        {selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newDate = new Date(selectedDate);
                                                            newDate.setMonth(newDate.getMonth() + 1);
                                                            setSelectedDate(newDate);
                                                        }}
                                                        style={styles.navButton}
                                                    >→</button>
                                                </div>
                                                <div style={styles.calendarWeekdays}>
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                        <div key={day} style={styles.weekday}>{day}</div>
                                                    ))}
                                                </div>
                                                <div style={styles.calendarDays}>
                                                    {Array.from({ length: new Date(
                                                        selectedDate.getFullYear(),
                                                        selectedDate.getMonth() + 1,
                                                        0
                                                    ).getDate() }, (_, i) => i + 1).map(day => {
                                                        const date = new Date(
                                                            selectedDate.getFullYear(),
                                                            selectedDate.getMonth(),
                                                            day
                                                        );
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const isPast = date < today;
                                                        const isSelected = 
                                                            day === selectedDate.getDate() &&
                                                            selectedDate.getMonth() === date.getMonth() &&
                                                            selectedDate.getFullYear() === date.getFullYear();

                                                        return (
                                                            <div
                                                                key={day}
                                                                style={{
                                                                    ...styles.calendarDay,
                                                                    backgroundColor: isSelected ? "#34C759" : "transparent",
                                                                    color: isPast ? "#ccc" : isSelected ? "white" : "#333",
                                                                    cursor: isPast ? "not-allowed" : "pointer"
                                                                }}
                                                                onClick={() => !isPast && handleDateSelect(day)}
                                                            >
                                                                {day}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {formData.service && formData.lotSize && (
                                <div style={{ marginBottom: "32px" }}>
                                    <PriceDisplay
                                        price={formData.discountedPrice}
                                        serviceType={formData.service}
                                        originalPrice={formData.price}
                                    />
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "16px" }}>
                                <button onClick={() => setStep(1)} style={styles.backButton}>
                                    Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (!formData.address || !formData.lotSize || !formData.service) {
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
                        >
                            <h2 style={{
                                fontSize: "24px",
                                fontWeight: "600",
                                marginBottom: "24px",
                                textAlign: "center"
                            }}>
                                Confirm Details
                            </h2>
                            <ConfirmationDetails
                                formData={formData}
                                loading={loading}
                                handlePayment={handlePayment}
                            />
                            <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                                <button onClick={() => setStep(2)} style={styles.backButton}>
                                    Back
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div style={{
                        color: "#DC2626",
                        fontSize: "14px",
                        marginTop: "16px",
                        textAlign: "center"
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    )
}
