import * as React from "react"
import { motion } from "framer-motion"

// Service configuration
const SERVICES = {
    ONE_TIME: { name: "One-time mowing", discount: 0 },
    WEEKLY: { name: "Weekly mowing", discount: 0.20 },
    BI_WEEKLY: { name: "Bi-Weekly mowing", discount: 0.10 },
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
    { value: 'BI_WEEKLY', label: 'Bi-weekly mowing (Save 10%)' },
    { value: 'WEEKLY', label: 'Weekly mowing (Save 20%)' }
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

const errorStyle = {
    fontSize: '12px',
    color: '#1f2937',
    marginTop: '4px',
    marginLeft: '4px'
};

const getInputStyle = (hasError) => ({
    ...inputStyle,
    border: hasError ? '2px solid #ef4444' : '2px solid #F5F5F5',
    ":focus": {
        border: hasError ? '2px solid #ef4444' : '2px solid #4CAF50',
        backgroundColor: "#FFFFFF"
    }
});

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
    ":hover": {
        border: "2px solid #4CAF50",
        backgroundColor: "#FFFFFF"
    }
}

const priceDisplayStyles = {
    container: {
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        width: '100%',
        marginTop: '24px',
    },
    popularBadge: {
        backgroundColor: '#34C759',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        display: 'inline-block',
        marginBottom: '16px',
    },
    priceSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
    },
    originalPrice: {
        fontSize: '24px',
        color: '#666',
        textDecoration: 'line-through',
        fontWeight: '500',
    },
    currentPrice: {
        fontSize: '36px',
        color: '#333',
        fontWeight: '600',
    },
    savingsBadge: {
        backgroundColor: '#E8F7ED',
        color: '#34C759',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
    },
    servicesList: {
        margin: '24px 0',
    },
    serviceItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        color: '#666',
        fontSize: '15px',
    },
    checkmark: {
        color: '#34C759',
    },
    paymentNote: {
        textAlign: 'center',
        color: '#666',
        fontSize: '14px',
        marginTop: '16px',
    },
    primaryButton: {
        width: '100%',
        height: '60px',
        backgroundColor: '#F7C35F',
        color: '#000000',
        border: 'none',
        borderRadius: '10px',
        fontSize: '17px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'Inter',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: '#f5b94a'
        }
    },
    paymentStep: {
        marginTop: '16px'
    },
    secureBadge: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: '#666',
        fontSize: '14px',
        marginBottom: '12px'
    },
    supportContact: {
        textAlign: 'center',
        marginTop: '16px',
        fontSize: '14px',
        color: '#666',
        '& a': {
            color: '#F7C35F',
            textDecoration: 'none',
            fontWeight: '500',
            '&:hover': {
                textDecoration: 'underline'
            }
        }
    },
    scheduleStep: {
        padding: '32px',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        fontFamily: 'Be Vietnam Pro',
        position: 'relative',
        overflow: 'hidden'
    },
    stepTitle: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '16px'
    },
    appointmentDetails: {
        padding: '16px',
        backgroundColor: '#f8f8f8',
        borderRadius: '12px',
        marginBottom: '24px'
    },
    detailItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    scheduleActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
    },
    backButton: {
        width: '100%',
        height: '60px',
        backgroundColor: '#F5F5F5',
        color: '#333',
        border: 'none',
        borderRadius: '10px',
        fontSize: '17px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'Inter',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: '#e9e9e9'
        }
    },
    appointmentConfirmed: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#34C759',
        marginBottom: '16px'
    },
    checkmark: {
        fontSize: '24px',
        marginRight: '8px'
    },
    paymentIntro: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '16px'
    },
    paymentNote: {
        fontSize: '14px',
        color: '#666',
        marginTop: '16px'
    }
};

const PriceDisplay = ({ price, serviceType, originalPrice, isProcessingPayment, handlePayment, formData }) => {
    const isRecurring = serviceType !== 'ONE_TIME'
    const [currentStep, setCurrentStep] = React.useState('quote') // 'quote' | 'schedule' | 'payment'
    const [appointmentConfirmed, setAppointmentConfirmed] = React.useState(false)
    
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

    const handleScheduleClick = () => {
        setCurrentStep('schedule')
    }

    const handleConfirmSchedule = () => {
        setAppointmentConfirmed(true)
        setCurrentStep('payment')
    }

    const renderScheduleStep = () => (
        <div className="schedule-step" style={priceDisplayStyles.scheduleStep}>
            <h3 style={priceDisplayStyles.stepTitle}>Confirm Your Service Details</h3>
            
            <div className="appointment-details" style={priceDisplayStyles.appointmentDetails}>
                <div className="detail-item" style={priceDisplayStyles.detailItem}>
                    <span>Service Type:</span>
                    <strong>{SERVICES[serviceType].name}</strong>
                </div>
                <div className="detail-item" style={priceDisplayStyles.detailItem}>
                    <span>First Service Date:</span>
                    <strong>{formData.startDate || 'Not selected'}</strong>
                </div>
                <div className="detail-item" style={priceDisplayStyles.detailItem}>
                    <span>Location:</span>
                    <strong>{formData.address}</strong>
                </div>
                <div className="detail-item" style={priceDisplayStyles.detailItem}>
                    <span>Total Price:</span>
                    <strong>${price}</strong>
                </div>
            </div>

            <div style={priceDisplayStyles.scheduleActions}>
                <button
                    onClick={() => setCurrentStep('quote')}
                    style={priceDisplayStyles.backButton}
                >
                    ← Back
                </button>
                <button
                    onClick={handleConfirmSchedule}
                    style={priceDisplayStyles.primaryButton}
                >
                    Confirm Schedule
                </button>
            </div>
        </div>
    )

    const renderPaymentStep = () => (
        <div className="payment-step" style={priceDisplayStyles.paymentStep}>
            <div style={priceDisplayStyles.appointmentConfirmed}>
                <span style={priceDisplayStyles.checkmark}>✓</span>
                Appointment Scheduled!
            </div>
            
            <div style={priceDisplayStyles.paymentIntro}>
                Last step: Add a payment method to secure your booking
            </div>

            <div className="secure-badge" style={priceDisplayStyles.secureBadge}>
                🔒 Secure payment powered by Stripe
            </div>
            
            <button
                className="payment-button"
                onClick={handlePayment}
                disabled={isProcessingPayment}
                style={priceDisplayStyles.primaryButton}
            >
                {isProcessingPayment ? 'Processing...' : 'Add Payment Method'}
            </button>

            <div style={priceDisplayStyles.paymentNote}>
                Remember: You'll only be charged after the service is completed
            </div>
        </div>
    )

    return (
        <div className="price-display-container" style={priceDisplayStyles.container}>
            {/* Service Badge */}
            <div className="popular-badge" style={priceDisplayStyles.popularBadge}>Most Popular</div>

            {currentStep === 'quote' && (
                <>
                    {/* Price Display */}
                    <div className="price-section" style={priceDisplayStyles.priceSection}>
                        {originalPrice && <span className="original-price" style={priceDisplayStyles.originalPrice}>${originalPrice}</span>}
                        <span className="current-price" style={priceDisplayStyles.currentPrice}>${price}</span>
                        {SERVICES[serviceType].discount > 0 && (
                            <span className="savings-badge" style={priceDisplayStyles.savingsBadge}>
                                Save {SERVICES[serviceType].discount * 100}%
                            </span>
                        )}
                    </div>

                    {/* Services List */}
                    <div style={priceDisplayStyles.servicesList}>
                        <div style={priceDisplayStyles.serviceItem}>
                            <span style={priceDisplayStyles.checkmark}>✓</span>
                            Professional mowing
                        </div>
                        <div style={priceDisplayStyles.serviceItem}>
                            <span style={priceDisplayStyles.checkmark}>✓</span>
                            Edge trimming
                        </div>
                        <div style={priceDisplayStyles.serviceItem}>
                            <span style={priceDisplayStyles.checkmark}>✓</span>
                            Grass clippings cleanup
                        </div>
                    </div>

                    {/* Payment Button */}
                    <button
                        onClick={handlePayment}
                        style={priceDisplayStyles.primaryButton}
                    >
                        Add Payment Method
                    </button>

                    {/* Payment Note */}
                    <div style={priceDisplayStyles.paymentNote}>
                        You will only be charged after the service is completed
                    </div>
                </>
            )}

            {/* Contact Support */}
            <div className="support-contact" style={priceDisplayStyles.supportContact}>
                Questions? We're here! <a href="tel:+14075452322">+1 407 545 2322</a>
            </div>
        </div>
    )
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
        phone: "",
        price: 0,
        showPrice: false
    });

    const [priceDisplay, setPriceDisplay] = React.useState("")
    const [error, setError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
    const [paymentError, setPaymentError] = React.useState("");
    const [showPrice, setShowPrice] = React.useState(false)
    const [showCalendar, setShowCalendar] = React.useState(false)
    const [stripePublishableKey, setStripePublishableKey] = React.useState("");
    const [selectedDate, setSelectedDate] = React.useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    });
    const [currentStep, setCurrentStep] = React.useState(1);
    const [showRequiredError, setShowRequiredError] = React.useState(false);
    const [fieldErrors, setFieldErrors] = React.useState({
        address: false,
        lotSize: false,
        service: false,
        phone: false
    });

    React.useEffect(() => {
        // Initialize dataLayer if it doesn't exist
        window.dataLayer = window.dataLayer || [];
        
        // Fetch Stripe publishable key from backend
        fetch('http://localhost:8080/config')
            .then(response => response.json())
            .then(data => {
                setStripePublishableKey(data.publishableKey);
            })
            .catch(error => {
                console.error('Error fetching Stripe config:', error);
                setPaymentError('Failed to load payment configuration');
            });
    }, []);

    React.useEffect(() => {
        // Save form data whenever it changes
        if (formData.price && formData.service && formData.address) {
            localStorage.setItem('lawnPeakQuoteData', JSON.stringify({
                service: formData.service,
                startDate: formData.startDate,
                address: formData.address,
                price: formData.price,
                lotSize: formData.lotSize
            }));
        }
    }, [formData]);

    React.useEffect(() => {
        // Send data to Framer immediately when address, service, or date changes
        if (formData.address && formData.service && formData.startDate) {
            if (window.parent) {
                // @ts-ignore - Framer Data API
                window.Data = window.Data || {};
                // @ts-ignore - Framer Data API
                window.Data.quoteData = {
                    service: formData.service,
                    startDate: formData.startDate,
                    address: formData.address,
                    price: formData.price,
                    lotSize: formData.lotSize
                };
            }
        }
    }, [formData.address, formData.service, formData.startDate, formData.price]);

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

    const handleAddressSelect = (address) => {
        setFormData(prev => ({
            ...prev,
            address: address
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const calculatePrice = (lotSize: string, service: string) => {
        if (!lotSize) {
            throw new Error("Invalid lot size")
        }
        
        // Base pricing for each tier with 100% margin for one-time
        let basePrice = 0;
        
        if (lotSize === 'SMALL') {
            basePrice = 60; // $30 cost -> 100% margin
        } else if (lotSize === 'MEDIUM') {
            basePrice = 70; // $35 cost -> 100% margin
        } else if (lotSize === 'LARGE') {
            basePrice = 75; // $35-38 cost -> ~100% margin
        } else {
            basePrice = 80; // $40 cost -> 100% margin
        }

        // Apply service type discounts
        const serviceDiscount = SERVICES[service].discount;
        const discountedPrice = basePrice * (1 - serviceDiscount);
        
        // Round to nearest $5
        return Math.round(discountedPrice / 5) * 5;
    }

    const handleLotSizeChange = (e) => {
        const value = e.target.value
        handleInputChange('lotSize', value)
        if (value && formData.service) {
            getQuote(value, formData.service)
        }
    };

    const handleServiceChange = (e) => {
        const value = e.target.value
        handleInputChange('service', value)
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
            setFormData(prev => ({ 
                ...prev, 
                price: calculatedPrice,
                showPrice: true // Ensure price is always shown after calculation
            }))
            
            onPriceChange?.(calculatedPrice)
            setShowPrice(true) // Ensure price is always shown
        } catch (error) {
            console.error('Error getting quote:', error)
            setError("Failed to get quote. Please try again.")
        } finally {
            setIsLoading(false)
        }
    };

    const handlePayment = async () => {
        // Update field errors
        const errors = {
            address: !formData.address,
            lotSize: !formData.lotSize,
            service: !formData.service,
            phone: !formData.phone || formData.phone.length < 10 // Basic phone validation
        };
        setFieldErrors(errors);

        if (Object.values(errors).some(error => error)) {
            return;
        }

        setIsProcessingPayment(true);
        setPaymentError(null);

        try {
            const baseUrl = window.location.origin + window.location.pathname;
            const successUrl = baseUrl;
            const cancelUrl = baseUrl;

            // Prepare data for both requests
            const quoteData = {
                name: formData.name || 'Not provided',
                email: formData.email || 'Not provided',
                phone: formData.phone,
                address: formData.address,
                lot_size: formData.lotSize,
                service_type: formData.service,
                price: formData.price,
                start_date: formData.startDate || 'Not provided'
            };

            // Send quote data to Google Sheets asynchronously
            const apiBaseUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8080'
                : 'https://lawn-peak-api.onrender.com';

            fetch(`${apiBaseUrl}/submit-quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify(quoteData)
            }).catch(error => {
                console.error('Error submitting quote data:', error);
                // Don't block the payment process if quote submission fails
            });

            // Proceed with setup intent
            const setupIntentResponse = await fetch(`${apiBaseUrl}/create-setup-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({
                    price: formData.price,
                    service_type: formData.service,
                    address: formData.address,
                    lot_size: formData.lotSize,
                    phone: formData.phone,
                    success_url: successUrl,
                    cancel_url: cancelUrl
                })
            });
            if (!setupIntentResponse.ok) {
                const errorData = await setupIntentResponse.json();
                console.error('Server response:', errorData);
                throw new Error(errorData.error || `HTTP error! status: ${setupIntentResponse.status}`);
            }

            const data = await setupIntentResponse.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.setupIntentUrl) {
                throw new Error('No setup URL returned from server');
            }

            // Save form data to localStorage before redirect
            localStorage.setItem('quoteFormData', JSON.stringify(formData));

            // Push event to dataLayer for Google Tag Manager
            window.dataLayer.push({
                'event': 'payment_method_added',
                'value': formData.price,
                'currency': 'USD',
                'service_type': formData.service,
                'lot_size': formData.lotSize
            });

            // Redirect to Stripe Checkout
            window.location.href = data.setupIntentUrl;

        } catch (error) {
            console.error('Payment error:', error);
            setPaymentError(error.message || 'An error occurred while setting up payment. Please try again.');
        } finally {
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
        const value = formatPhoneNumber(e.target.value);
        handleInputChange('phone', value);
    };

    const isFormValid = () => {
        return !!(
            formData.address &&
            formData.lotSize &&
            formData.service &&
            formData.phone &&
            formData.phone.length >= 10 // Basic phone validation
        );
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "600px",
            margin: "0 auto",
            padding: "0"
        }}>
            <AddressInput
                value={formData.address}
                onChange={(value) => handleInputChange('address', value)}
                onSelect={handleAddressSelect}
                placeholder="Enter your address"
            />
            
            <select
                value={formData.lotSize}
                onChange={handleLotSizeChange}
                style={selectStyle}
            >
                <option value="">Select lot size</option>
                {lotSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            <select
                value={formData.service}
                onChange={handleServiceChange}
                style={selectStyle}
            >
                <option value="">Select service</option>
                {serviceTypes.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {formData.lotSize && formData.service && (
                <div className="date-input-container">
                    <div
                        className="date-input"
                        onClick={() => setShowCalendar(!showCalendar)}
                    >
                        <span>{selectedDate ? formatDateForDisplay(selectedDate) : "Select preferred start date"}</span>
                        <span className="calendar-icon">📅</span>
                    </div>
                    {showCalendar && (
                        <div className="calendar-dropdown">
                            <div className="calendar-header">
                                <button onClick={() => {
                                    const newDate = new Date(selectedDate);
                                    newDate.setMonth(newDate.getMonth() - 1);
                                    setSelectedDate(newDate);
                                }} className="nav-button">←</button>
                                <div>
                                    {selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                                </div>
                                <button onClick={() => {
                                    const newDate = new Date(selectedDate);
                                    newDate.setMonth(newDate.getMonth() + 1);
                                    setSelectedDate(newDate);
                                }} className="nav-button">→</button>
                            </div>
                            <div className="calendar-weekdays">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="weekday">{day}</div>
                                ))}
                            </div>
                            <div className="calendar-days">
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
                                            className={`calendar-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
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

            <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="Phone number"
                style={inputStyle}
            />
            
            {isLoading ? (
                <div style={{
                    textAlign: "center",
                    padding: "20px"
                }}>
                    Loading...
                </div>
            ) : showPrice && (
                <PriceDisplay 
                    price={formData.price} 
                    serviceType={formData.service} 
                    originalPrice={calculatePrice(formData.lotSize, 'ONE_TIME')} 
                    isProcessingPayment={isProcessingPayment}
                    handlePayment={handlePayment}
                    formData={formData}
                />
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
                        color: #34C759;
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
                        overflow: 'visible';
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
                        background-color: #34C759;
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
                        color: #34C759;
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
                        background-color: #34C759;
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
                        background-color: #34C759;
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

const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
        if (window.google?.maps?.places) {
            resolve(window.google.maps);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDPMxdPl54WLri6kvQl6XNjVzTsXhuzOXw&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google.maps);
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
    });
};

function AddressInput({ value, onChange, onSelect, style, placeholder }) {
    const [addressError, setAddressError] = React.useState("")
    const [isLoadingAddress, setIsLoadingAddress] = React.useState(false)
    const inputRef = React.useRef(null)
    const autocompleteRef = React.useRef(null)
    const [selectedAddress, setSelectedAddress] = React.useState(value || "")

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
                        setSelectedAddress(place.formatted_address);
                        onChange(place.formatted_address);
                        onSelect(place.formatted_address);
                        // Prevent browser autofill from overriding
                        if (inputRef.current) {
                            inputRef.current.value = place.formatted_address;
                        }
                    }
                });

                autocompleteRef.current = autocomplete;
            } catch (error) {
                console.error("Error initializing autocomplete:", error);
                if (isMounted) {
                    setAddressError("Error initializing address search");
                }
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
                window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [onChange, onSelect]);

    // Keep input value in sync with selectedAddress
    React.useEffect(() => {
        if (inputRef.current && selectedAddress) {
            inputRef.current.value = selectedAddress;
        }
    }, [selectedAddress]);

    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative" }}>
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={selectedAddress}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSelectedAddress(value);
                        onChange(value);
                    }}
                    placeholder={isLoadingAddress ? "Loading address search..." : (placeholder || "Enter your address...")}
                    disabled={isLoadingAddress}
                    autoComplete="off"
                    style={{
                        width: "100%",
                        height: "60px",
                        padding: "12px 16px",
                        fontSize: "16px",
                        lineHeight: "1.2",
                        fontFamily: "Be Vietnam Pro",
                        fontWeight: "400",
                        color: "#333333",
                        backgroundColor: isLoadingAddress ? "#F8F8F8" : "#F5F5F5",
                        border: "2px solid #F5F5F5",
                        borderRadius: "12px",
                        outline: "none",
                        transition: "all 0.2s ease-in-out",
                        ":focus": {
                            border: "2px solid #4CAF50",
                            backgroundColor: "#FFFFFF"
                        },
                        ...style
                    }}
                />
                {isLoadingAddress && (
                    <div style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#718096",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <div style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid #718096",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                        }} />
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
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default QuoteCalculator
