import React from 'react';
import { Alert, Snackbar } from '@mui/material';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [error, setError] = React.useState<string | null>(null);
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
        const loadGoogleMaps = () => {
            if (typeof window !== 'undefined' && !window.google && !document.querySelector('#google-maps-script')) {
                console.log("Loading Google Maps script...");
                const script = document.createElement('script');
                script.id = 'google-maps-script';
                script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
                script.async = true;
                script.defer = true;
                
                window.initMap = function() {
                    console.log("Google Maps script loaded successfully");
                };

                script.onerror = function() {
                    const errorMsg = "Error loading Google Maps script";
                    console.error(errorMsg);
                    setError(errorMsg);
                };

                document.head.appendChild(script);
            }
        };

        try {
            loadGoogleMaps();
        } catch (err) {
            console.error('Error in Layout:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
        <div>
            <ThankYouMessage />
            {children}
            
            {error && (
                <Snackbar 
                    open={!!error} 
                    autoHideDuration={6000} 
                    onClose={() => setError(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={() => setError(null)} severity="error">
                        {error}
                    </Alert>
                </Snackbar>
            )}
        </div>
    );
}
