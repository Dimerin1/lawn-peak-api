export const loadGoogleMapsScript = () => {
    if (typeof window !== 'undefined' && !window.google && !document.querySelector('#google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
            console.error("Error loading Google Maps script");
        };

        document.head.appendChild(script);
    }
};
