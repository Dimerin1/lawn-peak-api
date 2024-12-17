import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// Service configuration
const SERVICES = {
    ONE_TIME: { name: "One-time mowing", discount: 0 },
    WEEKLY: { name: "Weekly mowing", discount: 0.25 },
    BI_WEEKLY: { name: "Bi-Weekly mowing", discount: 0.15 },
    MONTHLY: { name: "Monthly mowing", discount: 0 }
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

const inputStyle = {
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
};

const selectStyle = {
    ...inputStyle,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
    backgroundSize: "1em",
    paddingRight: "3rem",
    cursor: "pointer",
}

function QuoteCalculator({ onPriceChange, onServiceChange }) {
    const getTomorrowFormatted = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const month = tomorrow.toLocaleString('en-US', { month: 'short' });
        const day = tomorrow.getDate();
        const year = tomorrow.getFullYear();
        return `${month} ${day}, ${year}`;
    };

    const [formData, setFormData] = React.useState({
        address: "",
        lotSize: "",
        service: "",
        price: null,
        recurring: false,
        phone: "",
        quoteId: null,
        startDate: ""
    })
    const [priceDisplay, setPriceDisplay] = React.useState("")
    const [error, setError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false)
    const [paymentError, setPaymentError] = React.useState("")
    const [showPrice, setShowPrice] = React.useState(false)
    const [showCalendar, setShowCalendar] = React.useState(false)
    const [showThankYou, setShowThankYou] = React.useState(false)
    const [selectedDate, setSelectedDate] = React.useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    });

    // Check for success parameter ONLY on initial mount
    React.useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            console.log('URL Parameters:', Object.fromEntries(params.entries()));
            
            const setupStatus = params.get('setup');
            const customerId = params.get('customer_id');
            
            console.log('Setup Status:', setupStatus);
            console.log('Customer ID:', customerId);
            
            // Show thank you message if setup was successful and we have any customer ID
            if (setupStatus === 'success' && customerId) {
                console.log('Showing thank you message');
                setShowThankYou(true);
                // Auto-hide after 10 seconds
                setTimeout(() => {
                    setShowThankYou(false);
                    // Clear URL parameters
                    window.history.replaceState({}, '', window.location.pathname);
                }, 10000);
            } else {
                console.log('Conditions not met:', { setupStatus, customerId });
            }
        } catch (error) {
            console.error('Error checking success:', error);
        }
    }, []); // Empty dependency array means this only runs once on mount

    const formatDateForDisplay = (date) => {
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
    };

    const handleDateSelect = (day) => {
        const date = new Date(2024, 11, day);
        setSelectedDate(date);
        setFormData(prev => ({
            ...prev,
            startDate: formatDateForDisplay(date)
        }));
        setShowCalendar(false);
    };

    const handleAddressSelect = async (address: string) => {
        setIsLoading(true)
        try {
            setFormData(prev => ({
                ...prev,
                address
            }))
        } catch (err) {
            setError(err.message || "Error with address selection")
            setFormData(prev => ({
                ...prev,
                address: ""
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

    const handleLotSizeChange = (e) => {
        const value = e.target.value
        setFormData(prev => ({ ...prev, lotSize: value }))
        if (value && formData.service) {
            getQuote(value, formData.service)
        }
    };

    const handleServiceChange = (e) => {
        const value = e.target.value
        setFormData(prev => ({ ...prev, service: value }))
        onServiceChange?.(value)
        if (formData.lotSize && value) {
            getQuote(formData.lotSize, value)
        }
    }

    const getQuote = async (lotSize: string, service: string) => {
        try {
            setIsLoading(true)
            setError("")
            
            // Calculate price locally
            const calculatedPrice = calculatePrice(lotSize, service)
            
            // Store all quote data in localStorage
            const quoteData = {
                price: calculatedPrice,
                service_type: service,
                lot_size: lotSize,
                address: formData.address,
                phone: formData.phone
            }
            
            localStorage.setItem('quoteData', JSON.stringify(quoteData))
            
            // Update state
            setPriceDisplay(`$${calculatedPrice}`)
            setFormData(prev => ({ 
                ...prev, 
                price: calculatedPrice,
                service: service,
                lotSize: lotSize
            }))
            setShowPrice(true)
            
        } catch (err) {
            console.error("Quote error:", err)
            setError("Failed to calculate quote. Please try again.")
            setPriceDisplay("")
            setFormData(prev => ({ 
                ...prev, 
                price: null
            }))
            localStorage.removeItem('quoteData')
        } finally {
            setIsLoading(false)
        }
    };

    const handlePayment = async () => {
        if (isProcessingPayment) return;
        
        try {
            setIsProcessingPayment(true);
            setPaymentError("");
            
            const storedQuoteData = localStorage.getItem('quoteData');
            const quoteData = storedQuoteData ? JSON.parse(storedQuoteData) : null;
            
            if (!quoteData || !quoteData.price) {
                throw new Error('Please select lot size and service to get a quote first');
            }

            const customerName = localStorage.getItem('customerName');

            // Submit to sheets in background without blocking
            fetch('https://lawn-peak-api.onrender.com/submit-quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: customerName || '',
                    email: '',
                    service_type: formData.service,
                    phone: formData.phone,
                    address: formData.address,
                    lot_size: formData.lotSize,
                    price: quoteData.price,
                    payment_status: 'pending',
                    start_date: formData.startDate
                })
            }).catch(console.error); // Silent fail
            
            // Create setup intent immediately
            const response = await fetch('https://lawn-peak-api.onrender.com/create-setup-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quoteData: {
                        ...formData,
                        price: calculatePrice(formData.lotSize, formData.service),
                        startDate: selectedDate.toISOString(),
                    },
                    return_url: 'https://fabulous-screenshot-716470.framer.app', // Base URL only, no parameters
                    test_mode: process.env.NODE_ENV !== 'production' // Tell backend we're in test mode
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to setup payment method');
            }
            
            if (data.setupIntentUrl) {
                window.location.href = data.setupIntentUrl;
            } else {
                throw new Error('No setup URL received');
            }
            
        } catch (error) {
            setPaymentError(error.message || 'Failed to proceed to payment');
            setIsProcessingPayment(false);
        }
    };

    const formatPhoneNumber = (value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        
        // Don't format if empty
        if (!digits.length) return '';
        
        // Format as (XXX) XXX-XXXX
        let formatted = '';
        if (digits.length > 0) {
            formatted += '(';
            formatted += digits.slice(0, 3);
            if (digits.length > 3) {
                formatted += ') ';
                formatted += digits.slice(3, 6);
                if (digits.length > 6) {
                    formatted += '-';
                    formatted += digits.slice(6, 10);
                }
            }
        }
        return formatted;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Remove all non-digit characters for storage
        const digitsOnly = value.replace(/\D/g, '');
        
        // Only store up to 10 digits
        if (digitsOnly.length <= 10) {
            setFormData(prev => ({
                ...prev,
                phone: formatPhoneNumber(digitsOnly)
            }));
        }
    };

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}
        >
            {showThankYou && (
                <div 
                    style={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        textAlign: "center",
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 9999,
                        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                        width: "90%",
                        maxWidth: "500px",
                        animation: "fadeIn 0.5s ease-out"
                    }}
                >
                    <h2 style={{ fontSize: "28px", marginBottom: "16px", fontWeight: "600" }}>Thank You!</h2>
                    <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
                        Your payment method has been successfully set up. We'll charge your card after the service is completed.
                    </p>
                    <button 
                        onClick={() => {
                            setShowThankYou(false);
                            // Clear URL parameters after closing
                            window.history.replaceState({}, '', window.location.pathname);
                        }}
                        style={{
                            marginTop: "20px",
                            padding: "10px 20px",
                            backgroundColor: "white",
                            color: "#4CAF50",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500"
                        }}
                    >
                        Close
                    </button>
                </div>
            )}

            <div className="input-group">
                <AddressInput
                    value={formData.address}
                    onChange={(value) =>
                        setFormData((prev) => ({ ...prev, address: value }))
                    }
                    onSelect={handleAddressSelect}
                    style={{
                        input: inputStyle
                    }}
                    placeholder="Address"
                />
            </div>

            <div className="input-group">
                <select 
                    value={formData.lotSize}
                    onChange={handleLotSizeChange}
                    style={selectStyle}
                >
                    <option value="" disabled selected>Select lot size</option>
                    {lotSizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="input-group">
                <select 
                    value={formData.service}
                    onChange={handleServiceChange}
                    style={selectStyle}
                >
                    <option value="" disabled selected>Select your service</option>
                    {serviceTypes.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {formData.lotSize && formData.service && (
                <div className="input-group">
                    <div className="date-input-container">
                        <div 
                            className="date-input"
                            onClick={() => setShowCalendar(!showCalendar)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16 2V6" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 2V6" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3 10H21" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {formData.startDate || "Preferred Start Date"}
                        </div>
                        {showCalendar && (
                            <div className="calendar-dropdown">
                                <div className="calendar-header">
                                    <button className="nav-button">&lt;</button>
                                    <span>Dec 2024</span>
                                    <button className="nav-button">&gt;</button>
                                </div>
                                <div className="calendar-weekdays">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="weekday">{day}</div>
                                    ))}
                                </div>
                                <div className="calendar-days">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                        const date = new Date(2024, 11, day);
                                        const isPastDate = date < new Date().setHours(0, 0, 0, 0);
                                        const isSelected = selectedDate && 
                                            date.getDate() === selectedDate.getDate() &&
                                            date.getMonth() === selectedDate.getMonth() &&
                                            date.getFullYear() === selectedDate.getFullYear();

                                        return (
                                            <div 
                                                key={day}
                                                className={`calendar-day ${isPastDate ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                                                onClick={() => !isPastDate && handleDateSelect(day)}
                                            >
                                                {day}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="input-group">
                <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    style={inputStyle}
                />
            </div>
            {error && (
                <div style={{
                    color: "#e53e3e",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(229, 62, 62, 0.1)",
                    marginTop: "8px",
                    fontSize: "14px",
                    animation: "fadeIn 0.3s ease-out"
                }}>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div style={{
                    textAlign: "center",
                    padding: "16px",
                    color: "#718096"
                }}>
                    Calculating price...
                </div>
            ) : showPrice && (
                <div className="price-container">
                    {(formData.service === "WEEKLY" || formData.service === "BI_WEEKLY") && (
                        <>
                            <div className="info-icon" title="Hover for commitment details">!</div>
                            <div className="info-tooltip">
                                *Discount applies with 2-month minimum commitment.
                                Early cancellation will be billed at standard rate.
                            </div>
                        </>
                    )}
                    <div className="price-section">
                        {(formData.service === "WEEKLY" || formData.service === "BI_WEEKLY") && (
                            <span className="original-price">
                                ${calculatePrice(formData.lotSize, 'ONE_TIME')}
                            </span>
                        )}
                        <div className="price-amount">
                            ${formData.service ? 
                                Math.round(formData.price * (1 - (SERVICES[formData.service]?.discount || 0))) 
                                : formData.price}
                        </div>
                        {(formData.service === "WEEKLY" || formData.service === "BI_WEEKLY") && (
                            <div className="savings-badge">
                                Save {SERVICES[formData.service].discount * 100}%
                            </div>
                        )}
                    </div>
                    <button 
                        className="add-payment-button"
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                    >
                        {isProcessingPayment ? "Setting up payment..." : "Add Payment Method"}
                    </button>
                    {paymentError && (
                        <div style={{ color: "#e53e3e", marginTop: "8px", fontSize: "14px" }}>
                            {paymentError}
                        </div>
                    )}
                    <div className="trust-message">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                        Secure payment powered by Stripe
                    </div>
                </div>
            )}

            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .not-charged-message {
                        font-size: 15px;
                        font-weight: 500;
                        color: #4CAF50;
                        margin-bottom: 20px;
                        padding: 10px 20px;
                        background-color: rgba(76, 175, 80, 0.1);
                        border-radius: 12px;
                        display: inline-block;
                        border: 1px solid rgba(76, 175, 80, 0.2);
                    }
                    
                    .price-container {
                        background: #FFFFFF;
                        border-radius: 16px;
                        padding: 32px;
                        color: #000000;
                        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
                        animation: fadeIn 0.5s ease-out;
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                        margin: 8px 0;
                        text-align: center;
                        border: 1px solid rgba(0, 0, 0, 0.05);
                    }

                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .price-section {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        margin-bottom: 12px;
                    }

                    .original-price {
                        font-size: 28px;
                        font-weight: 500;
                        color: #666;
                        text-decoration: line-through;
                        position: relative;
                    }

                    .price-amount {
                        font-size: 42px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        color: #000000;
                        letter-spacing: -0.02em;
                    }
                    
                    .savings-badge {
                        background-color: #4CAF50;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 14px;
                        margin-left: 8px;
                        display: inline-block;
                    }
                    
                    .price-description {
                        font-size: 14px;
                        color: #666666;
                        margin-bottom: 24px;
                    }
                    
                    .add-payment-button {
                        background: #F7C35F;
                        color: #000000;
                        border: none;
                        border-radius: 10px;
                        height: 48px;
                        width: 100%;
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        font-weight: 600;
                        font-size: 15px;
                        line-height: 18px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        margin: 0 auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        letter-spacing: -0.01em;
                        padding: 0;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }

                    .add-payment-button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 2px 4px rgba(247, 195, 95, 0.1);
                    }

                    .add-payment-button:active {
                        transform: translateY(0);
                    }

                    .trust-message {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 4px;
                        margin-top: 8px;
                        color: #666666;
                        font-size: 13px;
                        font-weight: 400;
                    }

                    .trust-message svg {
                        width: 14px;
                        height: 14px;
                        color: #4CAF50;
                    }

                    input::placeholder,
                    input::-webkit-input-placeholder,
                    input::-moz-placeholder,
                    input:-ms-input-placeholder,
                    select:invalid,
                    select option[value=""] {
                        color: rgba(187, 187, 187, 0.8) !important;
                        opacity: 1 !important;
                    }
                    
                    select, select option {
                        color: #333333;
                    }
                    
                    .pac-container {
                        font-family: inherit !important;
                    }
                    .pac-item, .pac-item-query {
                        color: #333333 !important;
                    }
                    
                    .date-input-container {
                        position: relative;
                        width: 100%;
                    }

                    .input-group {
                        margin-bottom: 4px;
                    }

                    .input-label {
                        display: block;
                        margin-bottom: 8px;
                        color: #333;
                        font-size: 14px;
                    }

                    .info-icon {
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #f5f5f5;
                        color: #666;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: help;
                    }

                    .info-tooltip {
                        display: none;
                        position: absolute;
                        top: 40px;
                        right: 12px;
                        background: white;
                        padding: 12px;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        font-size: 13px;
                        color: #666;
                        max-width: 250px;
                        z-index: 10;
                    }

                    .info-icon:hover + .info-tooltip {
                        display: block;
                    }

                    .savings-badge {
                        background-color: #4CAF50;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 14px;
                        margin-left: 8px;
                        display: inline-block;
                    }

                    .date-input {
                        width: 100%;
                        height: 60px;
                        padding: 12px 16px;
                        font-size: 16px;
                        line-height: 1.2;
                        font-family: "Be Vietnam Pro";
                        font-weight: 400;
                        color: #333333;
                        background-color: #F5F5F5;
                        border: none;
                        border-radius: 12px;
                        outline: none;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .date-input.disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                        background-color: #e9e9e9;
                    }

                    .calendar-icon {
                        font-size: 18px;
                    }

                    .calendar-dropdown {
                        position: absolute;
                        top: calc(100% + 8px);
                        left: 0;
                        width: 100%;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        padding: 16px;
                        z-index: 1000;
                    }

                    .calendar-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                        color: #333;
                        font-weight: 500;
                    }

                    .nav-button {
                        background: none;
                        border: none;
                        padding: 8px;
                        cursor: pointer;
                        color: #666;
                        font-size: 16px;
                    }

                    .calendar-weekdays {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 4px;
                        margin-bottom: 8px;
                    }

                    .weekday {
                        text-align: center;
                        font-size: 14px;
                        color: #666;
                        padding: 4px;
                    }

                    .calendar-days {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 4px;
                    }

                    .calendar-day {
                        aspect-ratio: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        border-radius: 8px;
                        font-size: 14px;
                        color: #333;
                    }

                    .calendar-day:not(.past):hover {
                        background-color: rgba(76, 175, 80, 0.1);
                    }

                    .calendar-day.selected {
                        background-color: #4CAF50;
                        color: white;
                    }

                    .calendar-day.past {
                        color: #ccc;
                        cursor: not-allowed;
                    }

                    .select-input {
                        width: 100%;
                        height: 60px;
                        padding: 12px 16px;
                        font-size: 16px;
                        line-height: 1.2;
                        font-family: "Be Vietnam Pro";
                        font-weight: 400;
                        color: #333333;
                        background-color: #F5F5F5;
                        border: none;
                        border-radius: 12px;
                        outline: none;
                        cursor: pointer;
                        appearance: none;
                    }

                    .select-input::placeholder {
                        color: #666666;
                        opacity: 1;
                    }

                    .select-input option {
                        color: #333333;
                    }

                    .select-input option:first-child {
                        color: #666666;
                    }
                `}
            </style>
        </div>
    )
}

QuoteCalculator.defaultProps = {
    onPriceChange: () => {},
    onServiceChange: () => {}
}

addPropertyControls(QuoteCalculator, {
    onPriceChange: {
        type: ControlType.EventHandler
    },
    onServiceChange: {
        type: ControlType.EventHandler
    }
})

function AddressInput({ value, onChange, onSelect, style, placeholder }) {
    const [address, setAddress] = React.useState("")
    const [addressError, setAddressError] = React.useState("")
    const [isLoadingAddress, setIsLoadingAddress] = React.useState(false)
    const [isScriptLoaded, setIsScriptLoaded] = React.useState(false)
    const inputRef = React.useRef(null)

    React.useEffect(() => {
        // Load Google Maps script if not already loaded
        if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
            const script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`
            script.async = true
            script.defer = true
            script.onload = () => setIsScriptLoaded(true)
            document.head.appendChild(script)
        } else {
            setIsScriptLoaded(true)
        }
    }, [])

    React.useEffect(() => {
        if (isScriptLoaded && inputRef.current) {
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
                    onSelect(place.formatted_address)
                } catch (err) {
                    setAddressError(err.message || "Error selecting address")
                } finally {
                    setIsLoadingAddress(false)
                }
            })
        }
    }, [isScriptLoaded])
    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative" }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={isLoadingAddress}
                    style={{
                        ...inputStyle,
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

export default QuoteCalculator
