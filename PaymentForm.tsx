import { addPropertyControls, ControlType } from "framer"
import * as React from "react"

interface PaymentFormProps {
    onSuccess?: () => void
    onBack?: () => void
}

declare global {
    interface Window {
        Stripe?: any;
    }
}

const SERVICES: { [key: string]: { name: string } } = {
    ONE_TIME: { name: "One Time Service" },
    BI_WEEKLY: { name: "Bi-Weekly Service" },
    WEEKLY: { name: "Weekly Service" }
};

export function PaymentForm({ onSuccess, onBack }: PaymentFormProps) {
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [error, setError] = React.useState("");
    const [cardComplete, setCardComplete] = React.useState(false);
    const [card, setCard] = React.useState<any>(null);
    const [paymentSuccess, setPaymentSuccess] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [stripe, setStripe] = React.useState<any>(null);
    const [elements, setElements] = React.useState<any>(null);
    const [quoteData, setQuoteData] = React.useState<{
        price: number;
        service_type: string;
        lot_size: string;
        address: string;
        phone: string;
    } | null>(null);
    const cardElementRef = React.useRef<HTMLDivElement>(null);

    // Load Stripe
    React.useEffect(() => {
        const loadStripe = async () => {
            try {
                if (!window.Stripe) {
                    console.error('Stripe.js not loaded');
                    setError('Payment system not loaded. Please refresh the page.');
                    return;
                }
                
                const stripeInstance = window.Stripe('pk_test_51ONqUHFIWJQKnfxXBSWTlcKRGpvhBWRtQnxQxBTqVPxAYF3IkXlPHbOJBHQIxULhsqOQRXhTPTz8F8UbNrE7KtGD00yrTDUQbR');
                setStripe(stripeInstance);
                const elementsInstance = stripeInstance.elements();
                setElements(elementsInstance);
            } catch (err) {
                console.error('Error loading Stripe:', err);
                setError('Failed to initialize payment system');
            }
        };
        
        loadStripe();
    }, []);

    // Initialize Card Element
    React.useEffect(() => {
        if (!elements || !cardElementRef.current) return;

        try {
            const cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#1a1a1a',
                        fontFamily: 'Be Vietnam Pro, sans-serif',
                        '::placeholder': {
                            color: '#999999',
                        },
                        iconColor: '#1a1a1a',
                    },
                    invalid: {
                        color: '#dc3545',
                        iconColor: '#dc3545',
                    },
                },
            });

            cardElement.mount(cardElementRef.current);
            setCard(cardElement);

            cardElement.on('change', (event: any) => {
                setCardComplete(event.complete);
                if (event.error) {
                    setError(event.error.message);
                } else {
                    setError('');
                }
            });

            return () => {
                cardElement.unmount();
            };
        } catch (err) {
            console.error('Error initializing card element:', err);
            setError('Failed to initialize card input');
        }
    }, [elements, cardElementRef.current]);

    // Load quote data
    React.useEffect(() => {
        try {
            const storedQuote = localStorage.getItem('quoteData');
            if (storedQuote) {
                setQuoteData(JSON.parse(storedQuote));
            } else {
                setError("No quote found. Please go back and create a quote first.");
            }
        } catch (err) {
            setError("Failed to load quote data");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !card || !cardComplete || !quoteData) return;

        setIsProcessing(true);
        setError("");

        try {
            // Create payment intent
            const response = await fetch('https://lawn-peak.onrender.com/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: quoteData.price,
                    service_type: quoteData.service_type,
                    address: quoteData.address,
                    lot_size: quoteData.lot_size
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Payment failed');
            }

            const { clientSecret } = await response.json();

            // Confirm the payment
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: card,
                    billing_details: {
                        address: {
                            line1: quoteData.address,
                        },
                    },
                },
            });

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            if (paymentIntent.status === 'succeeded') {
                setPaymentSuccess(true);
                onSuccess?.();
                // Clear quote data after successful payment
                localStorage.removeItem('quoteData');
            }

        } catch (err: any) {
            console.error("Payment error:", err);
            setError(err.message || "Payment failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px',
        }}>
            <div style={{
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}>
                {isLoading ? (
                    <div style={{
                        display: "flex",
                        flexDirection: "column" as const,
                        alignItems: "center",
                        gap: "16px",
                        padding: "24px",
                    }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            border: "3px solid rgba(251, 176, 64, 0.1)",
                            borderTopColor: "#FFB74D",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }} />
                        <p style={{
                            color: "#666666",
                            fontSize: "16px",
                        }}>Loading quote details...</p>
                    </div>
                ) : error ? (
                    <div style={{
                        padding: "16px",
                        backgroundColor: "rgba(187, 187, 187, 0.15)",
                        borderRadius: "12px",
                    }}>
                        <p style={{
                            color: "#e53e3e",
                            fontSize: "14px",
                            fontFamily: 'Be Vietnam Pro, sans-serif',
                        }}>{error}</p>
                        <button 
                            onClick={() => {
                                const backButton = document.querySelector('[data-highlight="true"]');
                                if (backButton) {
                                    (backButton as HTMLElement).click();
                                }
                            }}
                            style={{
                                width: "100%",
                                height: "60px",
                                backgroundColor: "#FFB74D",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                                marginTop: "16px",
                                fontFamily: "Be Vietnam Pro",
                            }}
                        >
                            Go Back to Quote
                        </button>
                    </div>
                ) : quoteData ? (
                    <form onSubmit={handleSubmit}>
                        <div style={{
                            backgroundColor: "rgba(187, 187, 187, 0.15)",
                            borderRadius: "12px",
                            padding: "16px",
                        }}>
                            <div style={{
                                display: "flex" as const,
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "8px",
                            }}>
                                <div style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1a1a1a",
                                }}>Total Amount:</div>
                                <div style={{
                                    fontSize: "20px",
                                    fontWeight: "700",
                                    color: "#1a1a1a",
                                }}>${quoteData.price.toFixed(2)}</div>
                            </div>
                            <div style={{
                                fontSize: "14px",
                                color: "#666666",
                                "& p": {
                                    margin: "4px 0",
                                },
                            }}>
                                <p>Service Type: {SERVICES[quoteData.service_type].name}</p>
                                <p>Address: {quoteData.address}</p>
                            </div>
                        </div>

                        <div style={{
                            marginBottom: '20px',
                            width: '100%',
                        }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#333',
                                fontFamily: 'Be Vietnam Pro, sans-serif',
                            }}>Card Information</label>
                            <div 
                                ref={cardElementRef} 
                                style={{
                                    padding: '12px',
                                    backgroundColor: 'rgba(187, 187, 187, 0.15)',
                                    borderRadius: '12px',
                                    minHeight: '45px',
                                    position: 'relative',
                                    cursor: 'text',
                                    '&:hover': {
                                        backgroundColor: 'rgba(187, 187, 187, 0.25)',
                                    },
                                }} 
                            />
                            {error && <div style={{
                                color: '#dc3545',
                                fontSize: '14px',
                                marginTop: '8px',
                                fontFamily: 'Be Vietnam Pro, sans-serif',
                            }}>{error}</div>}
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing || !cardComplete}
                            style={{
                                width: "100%",
                                height: "60px",
                                backgroundColor: "#FFB74D",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: isProcessing || !cardComplete ? "not-allowed" : "pointer",
                                opacity: isProcessing || !cardComplete ? 0.7 : 1,
                                transition: "all 0.2s",
                                fontFamily: "Be Vietnam Pro",
                            }}
                        >
                            {isProcessing ? "Processing..." : "Pay Now"}
                        </button>
                    </form>
                ) : null}
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: "100%",
        display: "flex" as const,
        flexDirection: "column" as const,
        gap: "24px",
    },
    form: {
        display: "flex" as const,
        flexDirection: "column" as const,
        gap: "24px",
    },
    quoteDetails: {
        backgroundColor: "rgba(187, 187, 187, 0.15)",
        borderRadius: "12px",
        padding: "16px",
    },
    amountContainer: {
        display: "flex" as const,
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
    },
    amountLabel: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#1a1a1a",
    },
    amountValue: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#1a1a1a",
    },
    serviceDetails: {
        fontSize: "14px",
        color: "#666666",
        "& p": {
            margin: "4px 0",
        },
    },
    inputGroup: {
        marginBottom: '20px',
        width: '100%',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#333',
        fontFamily: 'Be Vietnam Pro, sans-serif',
    },
    error: {
        color: '#dc3545',
        fontSize: '14px',
        marginTop: '8px',
        fontFamily: 'Be Vietnam Pro, sans-serif',
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        gap: "16px",
        padding: "24px",
    },
    loadingSpinner: {
        width: "32px",
        height: "32px",
        border: "3px solid rgba(251, 176, 64, 0.1)",
        borderTopColor: "#FFB74D",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        color: "#666666",
        fontSize: "16px",
    },
    errorContainer: {
        padding: "16px",
        backgroundColor: "rgba(187, 187, 187, 0.15)",
        borderRadius: "12px",
    },
};

addPropertyControls(PaymentForm, {
    onSuccess: {
        type: ControlType.EventHandler,
    },
    onBack: {
        type: ControlType.EventHandler,
    },
});

export default PaymentForm as React.ComponentType;
