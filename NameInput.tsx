import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export function NameInput() {
    const [name, setName] = React.useState("")
    const [showThankYou, setShowThankYou] = React.useState(false)
    const [showCanceled, setShowCanceled] = React.useState(false)

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const setupStatus = params.get('setup')
        const customerId = params.get('customer_id')
        
        console.log('NameInput: Checking URL parameters:', {
            setupStatus,
            customerId
        })
        
        if (setupStatus === 'success' && customerId) {
            console.log('NameInput: Payment success detected')
            setShowThankYou(true)
            setShowCanceled(false)
            
            // Auto-hide after 10 seconds
            const timer = setTimeout(() => {
                setShowThankYou(false)
                window.history.replaceState({}, '', window.location.pathname)
            }, 10000)
            
            return () => clearTimeout(timer)
        } else if (setupStatus === 'canceled') {
            console.log('NameInput: Payment canceled detected')
            setShowCanceled(true)
            setShowThankYou(false)
        }
    }, [])

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
    }

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.3s ease-out',
        borderRadius: '24px',
    } as const

    const messageStyle = (isSuccess = true) => ({
        backgroundColor: isSuccess ? '#4CAF50' : '#FF9800',
        padding: '2.5rem',
        borderRadius: '24px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        animation: 'slideUp 0.4s ease-out',
        fontFamily: 'Be Vietnam Pro',
    }) as const

    const titleStyle = {
        fontSize: '32px',
        fontWeight: '600',
        marginBottom: '1.5rem',
        fontFamily: 'Be Vietnam Pro',
        letterSpacing: '-0.02em',
    } as const

    const textStyle = {
        fontSize: '18px',
        lineHeight: '1.6',
        marginBottom: '1.5rem',
        fontFamily: 'Be Vietnam Pro',
        fontWeight: '400',
        opacity: '0.95',
    } as const

    const buttonStyle = (isPrimary = true) => ({
        marginTop: '0.5rem',
        padding: '12px 24px',
        backgroundColor: isPrimary ? 'white' : 'transparent',
        border: isPrimary ? 'none' : '2px solid white',
        borderRadius: '12px',
        cursor: 'pointer',
        color: isPrimary ? '#FF9800' : 'white',
        fontWeight: '600',
        fontSize: '16px',
        transition: 'transform 0.2s ease',
        fontFamily: 'Be Vietnam Pro',
        boxShadow: isPrimary ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
        ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: isPrimary ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
        },
        marginLeft: !isPrimary ? '12px' : '0',
    }) as const

    const handleChange = (e) => {
        const value = e.target.value
        setName(value)
        localStorage.setItem('customerName', value)
    }

    const handleContactClick = () => {
        window.location.href = 'tel:+14075452322'
    }

    const handleTryAgainClick = () => {
        setShowCanceled(false)
        window.history.replaceState({}, '', window.location.pathname)
    }

    const handleReviewsClick = () => {
        const reviewsSection = document.querySelector('#reviews')
        if (reviewsSection) {
            reviewsSection.scrollIntoView({ behavior: 'smooth' })
            // Hide the message after scrolling
            setTimeout(() => {
                setShowCanceled(false)
                window.history.replaceState({}, '', window.location.pathname)
            }, 1000)
        }
    }

    return (
        <>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { 
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to { 
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .message-button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }
                    .text-button {
                        background: none;
                        border: none;
                        color: white;
                        text-decoration: underline;
                        cursor: pointer;
                        font-family: 'Be Vietnam Pro';
                        font-size: 14px;
                        opacity: 0.9;
                        margin-top: 16px;
                        transition: opacity 0.2s ease;
                    }
                    .text-button:hover {
                        opacity: 1;
                    }
                `}
            </style>
            {showThankYou && (
                <div style={overlayStyle}>
                    <div style={messageStyle(true)}>
                        <h2 style={titleStyle}>Thank You!</h2>
                        <p style={textStyle}>
                            Your payment method has been successfully set up. 
                            We'll charge your card after the service is completed.
                        </p>
                        <button 
                            className="message-button"
                            onClick={() => {
                                setShowThankYou(false)
                                window.history.replaceState({}, '', window.location.pathname)
                            }}
                            style={buttonStyle(true)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            {showCanceled && (
                <div style={overlayStyle}>
                    <div style={messageStyle(false)}>
                        <h2 style={titleStyle}>Need Help?</h2>
                        <p style={textStyle}>
                            We noticed you didn't complete your booking. Our team is here to help!
                            Call us for a special discount or if you have any questions.
                        </p>
                        <div>
                            <button 
                                className="message-button"
                                onClick={handleContactClick}
                                style={buttonStyle(true)}
                            >
                                Call Now for 10% Off
                            </button>
                            <button 
                                onClick={handleTryAgainClick}
                                style={buttonStyle(false)}
                            >
                                Try Again
                            </button>
                        </div>
                        <button 
                            className="text-button"
                            onClick={handleReviewsClick}
                        >
                            Still not sure? Join over 30,000 happy customers
                        </button>
                    </div>
                </div>
            )}
            <input
                type="text"
                value={name}
                onChange={handleChange}
                placeholder="Enter your name"
                style={inputStyle}
            />
        </>
    )
}

addPropertyControls(NameInput, {})

export default NameInput
