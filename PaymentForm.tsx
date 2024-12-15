import { addPropertyControls, ControlType } from "framer"
import * as React from "react"

interface PaymentFormProps {
    onSuccess?: () => void
    onBack?: () => void
}

const SERVICES: { [key: string]: { name: string } } = {
    ONE_TIME: { name: "One Time Service" },
    BI_WEEKLY: { name: "Bi-Weekly Service" },
    WEEKLY: { name: "Weekly Service" }
};

function PaymentForm({ onSuccess, onBack }: PaymentFormProps) {
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [error, setError] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const [quoteData, setQuoteData] = React.useState<{
        price: number;
        service_type: string;
        lot_size: string;
        address: string;
        phone: string;
    } | null>(null);

    // Load quote data
    React.useEffect(() => {
        try {
            const storedQuote = localStorage.getItem('quoteData');
            if (storedQuote) {
                setQuoteData(JSON.parse(storedQuote));
            } else {
                // For Framer preview, create mock data if no quote exists
                setQuoteData({
                    price: 99.99,
                    service_type: 'ONE_TIME',
                    lot_size: 'MEDIUM',
                    address: '123 Main St',
                    phone: '555-0123'
                });
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
        if (!quoteData) return;

        setIsProcessing(true);
        setError("");

        try {
            // Create the URL with query parameters
            const params = new URLSearchParams({
                price: (quoteData.price * 100).toString(), // Convert to cents
                service_type: quoteData.service_type,
                address: quoteData.address,
                lot_size: quoteData.lot_size,
                success_url: 'https://fabulous-screenshot-716470.framer.app/success',
                cancel_url: 'https://fabulous-screenshot-716470.framer.app/quote'
            });

            // Redirect to our backend checkout endpoint
            window.location.href = `https://lawn-peak-api.onrender.com/checkout?${params.toString()}`;
        } catch (err: any) {
            console.error("Payment error:", err);
            setError(err.message || "Payment failed. Please try again.");
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
                            onClick={onBack}
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
                            marginBottom: "20px",
                        }}>
                            <div style={{
                                display: "flex",
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
                            }}>
                                <p style={{ margin: "4px 0" }}>Service Type: {SERVICES[quoteData.service_type].name}</p>
                                <p style={{ margin: "4px 0" }}>Address: {quoteData.address}</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            style={{
                                width: "100%",
                                height: "60px",
                                backgroundColor: "#FFB74D",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: isProcessing ? "not-allowed" : "pointer",
                                opacity: isProcessing ? 0.7 : 1,
                                transition: "all 0.2s",
                                fontFamily: "Be Vietnam Pro",
                            }}
                        >
                            {isProcessing ? "Processing..." : "Proceed to Payment"}
                        </button>
                    </form>
                ) : null}
            </div>
        </div>
    );
}

PaymentForm.displayName = "Form"

addPropertyControls(PaymentForm, {
    onSuccess: {
        type: ControlType.EventHandler,
    },
    onBack: {
        type: ControlType.EventHandler,
    },
})

export default PaymentForm
