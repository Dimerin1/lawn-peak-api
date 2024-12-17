import * as React from "react"

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

const PriceDisplay = ({ price, serviceType, originalPrice, isProcessingPayment, handlePayment, referralDiscount }) => {
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

    const getComparisonHint = () => {
        switch(serviceType) {
            case 'ONE_TIME':
                return { text: 'Switch to weekly and save 20%', color: '#34C759' }
            case 'MONTHLY':
                return { text: 'Switch to bi-weekly and save 10%', color: '#34C759' }
            default:
                return null
        }
    }

    const badge = getServiceBadge()
    const hint = getComparisonHint()

    return (
        <div style={{
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            fontFamily: 'Be Vietnam Pro',
            marginBottom: '16px',
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
                        {referralDiscount > 0 && (
                            <span style={{ 
                                backgroundColor: '#34C759', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '6px', 
                                fontSize: '14px',
                                fontFamily: 'Be Vietnam Pro',
                            }}>
                                Save {referralDiscount * 100}%
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

            <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                textAlign: 'center',
                marginBottom: '24px',
                fontFamily: 'Be Vietnam Pro',
                fontStyle: 'italic'
            }}>
                You will only be charged after the service is completed
            </div>

            <button
                className="add-payment-button"
                onClick={handlePayment}
                disabled={isProcessingPayment}
                style={{
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
                }}
            >
                {isProcessingPayment ? "Setting up payment..." : "Add Payment Method"}
            </button>
            <div style={{ 
                textAlign: 'center', 
                marginTop: '12px', 
                fontSize: '14px', 
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontFamily: 'Be Vietnam Pro',
            }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Secure payment powered by Stripe
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
        showPrice: false,
        startDate: "",
        email: "", 
        referralCode: "", 
    });

    const [priceDisplay, setPriceDisplay] = React.useState("")
    const [error, setError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false)
    const [paymentError, setPaymentError] = React.useState("")
    const [showPrice, setShowPrice] = React.useState(false)
    const [showCalendar, setShowCalendar] = React.useState(false)
    const [stripePublishableKey, setStripePublishableKey] = React.useState("")
    const [referralError, setReferralError] = React.useState("")
    const [isValidatingReferral, setIsValidatingReferral] = React.useState(false)
    const [referralDiscount, setReferralDiscount] = React.useState(0)
    const [selectedDate, setSelectedDate] = React.useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [currentStep, setCurrentStep] = React.useState(1);
    const [showRequiredError, setShowRequiredError] = React.useState(false);
    const [fieldErrors, setFieldErrors] = React.useState({
        address: false,
        lotSize: false,
        service: false,
        phone: false,
        startDate: false
    });

    const calendarRef = React.useRef(null);

    const handleClickOutside = React.useCallback((event: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
            setShowCalendar(false);
        }
    }, []);

    React.useEffect(() => {
        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar, handleClickOutside]);

    React.useEffect(() => {
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

    const formatDateForDisplay = (date) => {
        if (!date) return '';
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const handleDateSelect = (date: Date) => {
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        setFormData(prev => ({
            ...prev,
            startDate: formattedDate
        }));
        setShowCalendar(false);
    };

    const generateCalendarDays = (year, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add the days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push({
                date,
                isDisabled: date < today,
                isToday: date.getTime() === today.getTime(),
                isSelected: selectedDate && date.getTime() === selectedDate.getTime()
            });
        }

        return days;
    };

    const [currentMonth, setCurrentMonth] = React.useState(() => {
        const today = new Date();
        return {
            month: today.getMonth(),
            year: today.getFullYear()
        };
    });

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newMonth = prev.month + direction;
            const newYear = prev.year + Math.floor(newMonth / 12);
            return {
                month: (newMonth + 12) % 12,
                year: newYear
            };
        });
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
                phone: formData.phone,
                start_date: formData.startDate || 'Not provided'
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

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setFormData(prev => ({
            ...prev,
            startDate: formatDateForDisplay(date)
        }));
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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = formatPhoneNumber(e.target.value);
        handleInputChange('phone', value);
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

    const isFormValid = () => {
        return !!(
            formData.address &&
            formData.lotSize &&
            formData.service &&
            formData.phone &&
            formData.phone.length >= 10 &&
            formData.startDate
        );
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessingPayment(true);
        setPaymentError(null);

        try {
            const errors = {
                address: !formData.address,
                lotSize: !formData.lotSize,
                service: !formData.service,
                phone: !formData.phone || formData.phone.length < 10,
                startDate: !formData.startDate
            };
            setFieldErrors(errors);

            if (!isFormValid()) {
                setIsProcessingPayment(false);
                return;
            }

            const baseUrl = window.location.href.split('?')[0];
            const successUrl = `${baseUrl}?setup=success`;
            const cancelUrl = `${baseUrl}?setup=canceled`;

            // Prepare data for both requests
            const quoteData = {
                name: formData.name || 'Not provided',
                email: formData.email || 'Not provided',
                phone: formData.phone,
                address: formData.address,
                lot_size: formData.lotSize,
                service_type: formData.service,
                price: formData.price,
                start_date: formData.startDate
            };

            // Send quote data to Google Sheets
            const apiBaseUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8080'
                : 'https://lawn-peak-api.onrender.com';

            const quoteResponse = await fetch(`${apiBaseUrl}/submit-quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify(quoteData)
            });

            if (!quoteResponse.ok) {
                console.error('Error submitting quote:', await quoteResponse.text());
            }

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
                    address: formData.address,
                    service_type: formData.service,
                    lot_size: formData.lotSize,
                    phone: formData.phone,
                    start_date: formData.startDate,
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                    referral_code: formData.referralCode || null
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

            // Redirect to Stripe Checkout
            window.location.href = data.setupIntentUrl;

        } catch (error) {
            console.error('Payment error:', error);
            setPaymentError(error.message || 'An error occurred while setting up payment. Please try again.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const shouldShowCalendarInput = formData.service && formData.lotSize;

    const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase()
        handleInputChange("referralCode", value)
    }

    const validateReferralCode = async () => {
        if (!formData.referralCode) {
            setReferralError("")
            setReferralDiscount(0)
            return
        }

        setIsValidatingReferral(true)
        try {
            const apiBaseUrl = window.location.hostname === "localhost"
                ? "http://localhost:8080"
                : window.location.hostname.includes('staging')
                    ? 'https://lawn-peak-api-staging.onrender.com'
                    : 'https://lawn-peak-api.onrender.com'

            const response = await fetch(`${apiBaseUrl}/api/referral/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: formData.referralCode,
                    referee_email: formData.email || 'Not provided'
                })
            })

            const data = await response.json()
            if (response.ok && data.valid) {
                setReferralError("")
                setReferralDiscount(data.discount)
                // Update final price with discount
                if (formData.price) {
                    const discountedPrice = formData.price * (1 - data.discount)
                    setFormData(prev => ({ ...prev, price: Math.round(discountedPrice) }))
                }
            } else {
                setReferralError(data.error || "Invalid referral code")
                setReferralDiscount(0)
                // Reset price to original if there was a discount applied
                if (formData.lotSize && formData.service) {
                    const originalPrice = calculatePrice(formData.lotSize, formData.service)
                    setFormData(prev => ({ ...prev, price: originalPrice }))
                }
            }
        } catch (error) {
            console.error('Referral validation error:', error)
            setReferralError("Failed to validate referral code")
            setReferralDiscount(0)
        } finally {
            setIsValidatingReferral(false)
        }
    }

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
                style={getInputStyle(fieldErrors.service)}
            >
                <option value="" disabled selected>Select your service</option>
                {serviceTypes.map(option => (
                    <option value={option.value}>{option.label}</option>
                ))}
            </select>
            {fieldErrors.service && (
                <div style={errorStyle}>
                    Please select a service type
                </div>
            )}

            {shouldShowCalendarInput && (
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <div
                        onClick={() => setShowCalendar(!showCalendar)}
                        style={{
                            ...getInputStyle(fieldErrors.startDate),
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            color: formData.startDate ? '#333333' : '#666666'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '12px' }}>
                            <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {formData.startDate || "Pick preferred date"}
                    </div>
                    {showCalendar && (
                        <div 
                            ref={calendarRef}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                padding: '16px',
                                zIndex: 1000,
                                marginTop: '8px',
                                minWidth: '300px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <button onClick={() => navigateMonth(-1)} style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    padding: '8px'
                                }}>&lt;</button>
                                <span style={{ fontWeight: 500 }}>
                                    {new Date(currentMonth.year, currentMonth.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={() => navigateMonth(1)} style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    padding: '8px'
                                }}>&gt;</button>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: '4px',
                                textAlign: 'center'
                            }}>
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                    <div key={day} style={{ 
                                        padding: '4px',
                                        fontSize: '12px',
                                        color: '#666666'
                                    }}>{day}</div>
                                ))}
                                {generateCalendarDays(currentMonth.year, currentMonth.month).map((day, index) => (
                                    <div
                                        key={index}
                                        onClick={() => day && !day.isDisabled && handleDateSelect(day.date)}
                                        style={{
                                            padding: '8px 4px',
                                            cursor: day?.isDisabled ? 'default' : 'pointer',
                                            backgroundColor: day?.isSelected ? '#4CAF50' : 'transparent',
                                            color: day?.isDisabled ? '#999' : day?.isSelected ? 'white' : '#333',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {day?.date.getDate()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {fieldErrors.startDate && (
                        <div style={errorStyle}>
                            Please select a preferred date
                        </div>
                    )}
                </div>
            )}

            <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                style={getInputStyle(fieldErrors.phone)}
                placeholder="Phone number"
            />

            <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                style={getInputStyle(false)}
                placeholder="Email (optional)"
            />

            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={formData.referralCode}
                    onChange={handleReferralCodeChange}
                    onBlur={validateReferralCode}
                    style={getInputStyle(!!referralError)}
                    placeholder="Referral code (optional)"
                    maxLength={8}
                />
                {isValidatingReferral && (
                    <div style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#666'
                    }}>
                        Validating...
                    </div>
                )}
                {referralError && (
                    <div style={errorStyle}>{referralError}</div>
                )}
                {referralDiscount > 0 && (
                    <div style={{
                        fontSize: '14px',
                        color: '#34C759',
                        marginTop: '4px',
                        marginLeft: '4px'
                    }}>
                        {`${referralDiscount * 100}% discount applied!`}
                    </div>
                )}
            </div>

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
                    referralDiscount={referralDiscount}
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
            try {
                setIsLoadingAddress(true);
                await loadGoogleMapsScript();

                if (!isMounted) return;

                if (inputRef.current && !autocompleteRef.current) {
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
                }
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
    }, []);

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
                    placeholder={placeholder}
                    disabled={isLoadingAddress}
                    autoComplete="off"
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
    );
}

export default QuoteCalculator
