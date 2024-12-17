import { useEffect } from 'react';

export function GoogleMapsScript() {
    useEffect(() => {
        // Check if the script is already loaded
        if (typeof window.google !== 'undefined') {
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return null;
}
