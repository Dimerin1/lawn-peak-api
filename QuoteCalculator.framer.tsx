// QuoteCalculator component for Framer
// IMPORTANT: Replace these environment variables with your staging values
const NEXT_PUBLIC_API_URL = "https://lawn-peak-api-staging.onrender.com";
const NEXT_PUBLIC_ENABLE_REFERRAL_SYSTEM = "true";

export function QuoteCalculator() {
    // === State Management ===
    const [formData, setFormData] = React.useState({
        address: "",
        lotSize: "",
        service: "",
        email: "",
        phone: "",
        startDate: "",
        price: 0
    });

    // Referral system state
    const [referralCode, setReferralCode] = React.useState("");
    const [referralError, setReferralError] = React.useState("");
    const [referralDiscount, setReferralDiscount] = React.useState(0);
    const [isValidatingReferral, setIsValidatingReferral] = React.useState(false);

    // === Styles ===
    const inputStyle = {
        width: "100%",
        padding: "12px",
        marginBottom: "8px",
        borderRadius: "8px",
        border: "1px solid #E5E7EB",
        fontSize: "16px",
        backgroundColor: "#F9FAFB"
    };

    const labelStyle = {
        display: "block",
        marginBottom: "8px",
        color: "#374151",
        fontSize: "14px",
        fontWeight: "500"
    };

    const errorStyle = {
        color: "#EF4444",
        fontSize: "14px",
        marginTop: "4px"
    };

    const successStyle = {
        color: "#34D399",
        fontSize: "14px",
        marginTop: "4px"
    };

    // === Referral Code Validation ===
    const validateReferralCode = async () => {
        if (!referralCode) {
            setReferralError("");
            setReferralDiscount(0);
            return;
        }

        setIsValidatingReferral(true);
        try {
            const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/referral/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: referralCode,
                    referee_email: formData.email
                })
            });

            const data = await response.json();
            if (response.ok) {
                setReferralError("");
                setReferralDiscount(data.discount);
                // Update price with discount
                const discountedPrice = formData.price * (1 - data.discount);
                setFormData(prev => ({ ...prev, price: discountedPrice }));
            } else {
                setReferralError(data.error);
                setReferralDiscount(0);
            }
        } catch (error) {
            setReferralError("Failed to validate referral code");
            setReferralDiscount(0);
        } finally {
            setIsValidatingReferral(false);
        }
    };

    // === Price Calculation ===
    const calculatePrice = (lotSize: string, serviceType: string) => {
        // Your existing price calculation logic
        const basePrice = parseInt(lotSize) * 50;
        if (serviceType === 'WEEKLY') {
            return basePrice * 0.8; // 20% discount
        } else if (serviceType === 'BI_WEEKLY') {
            return basePrice * 0.9; // 10% discount
        }
        return basePrice;
    };

    // === Form Submission ===
    const handleSubmit = async () => {
        // Your existing form submission logic
        // Make sure to include referralCode in the submission
        const payload = {
            ...formData,
            referral_code: referralCode || null
        };

        // Add your form submission code here
    };

    return (
        <div style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px"
        }}>
            {/* Address Input */}
            <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Address</label>
                <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    style={inputStyle}
                    placeholder="Enter your address"
                />
            </div>

            {/* Lot Size Selection */}
            <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Lot Size</label>
                <select
                    value={formData.lotSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, lotSize: e.target.value }))}
                    style={inputStyle}
                >
                    <option value="">Select lot size</option>
                    <option value="small">Small (up to 5,000 sq ft)</option>
                    <option value="medium">Medium (5,000-10,000 sq ft)</option>
                    <option value="large">Large (10,000+ sq ft)</option>
                </select>
            </div>

            {/* Service Type Selection */}
            <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Service Type</label>
                <select
                    value={formData.service}
                    onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                    style={inputStyle}
                >
                    <option value="">Select service type</option>
                    <option value="ONE_TIME">One-time service</option>
                    <option value="WEEKLY">Weekly service (20% off)</option>
                    <option value="BI_WEEKLY">Bi-weekly service (10% off)</option>
                </select>
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Email</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={inputStyle}
                    placeholder="Enter your email"
                />
            </div>

            <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Phone</label>
                <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={inputStyle}
                    placeholder="Enter your phone number"
                />
            </div>

            {/* Referral Code Input */}
            {NEXT_PUBLIC_ENABLE_REFERRAL_SYSTEM === 'true' && (
                <div style={{ marginBottom: "16px" }}>
                    <label style={labelStyle}>Referral Code (Optional)</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            onBlur={validateReferralCode}
                            style={{
                                ...inputStyle,
                                flex: 1,
                                textTransform: "uppercase"
                            }}
                            placeholder="Enter referral code"
                        />
                        {isValidatingReferral && (
                            <div style={{ display: "flex", alignItems: "center", padding: "0 12px" }}>
                                <span>⟳</span>
                            </div>
                        )}
                    </div>
                    {referralError && <div style={errorStyle}>{referralError}</div>}
                    {referralDiscount > 0 && (
                        <div style={successStyle}>
                            {referralDiscount * 100}% discount applied!
                        </div>
                    )}
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#10B981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    cursor: "pointer"
                }}
            >
                Get Quote
            </button>
        </div>
    );
}
