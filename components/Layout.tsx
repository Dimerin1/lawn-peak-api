import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [showThankYou, setShowThankYou] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const setupStatus = params.get('setup');
            const customerId = params.get('customer_id');
            return setupStatus === 'success' && customerId ? true : false;
        }
        return false;
    });

    React.useEffect(() => {
        // Load Google Maps script
        if (typeof window.google === 'undefined') {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const params = new URLSearchParams(window.location.search);
        const setupStatus = params.get('setup');
        const customerId = params.get('customer_id');
        
        console.log('Layout: Checking URL parameters:', {
            setupStatus,
            customerId,
            showThankYou
        });
        
        if (setupStatus === 'success' && customerId) {
            console.log('Layout: Payment success detected');
            setShowThankYou(true);
            
            // Auto-hide after 10 seconds
            const timer = setTimeout(() => {
                setShowThankYou(false);
                window.history.replaceState({}, '', window.location.pathname);
            }, 10000);
            
            return () => clearTimeout(timer);
        }
    }, []);

    const ThankYouMessage = () => showThankYou ? (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}
        >
            <div 
                style={{
                    backgroundColor: '#4CAF50',
                    padding: '2rem',
                    borderRadius: '8px',
                    maxWidth: '500px',
                    width: '90%',
                    textAlign: 'center',
                    color: 'white'
                }}
            >
                <h2 style={{ marginBottom: '1rem' }}>Thank You!</h2>
                <p>Your payment method has been successfully set up. We'll charge your card after the service is completed.</p>
                <button 
                    onClick={() => {
                        setShowThankYou(false);
                        window.history.replaceState({}, '', window.location.pathname);
                    }}
                    style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    ) : null;

    return (
        <>
            <ThankYouMessage />
            {children}
        </>
    );
}