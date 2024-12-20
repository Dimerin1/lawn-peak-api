/// <reference types="@types/google.maps" />

declare global {
    interface Window {
        google: typeof google;
        dataLayer: (string | number | boolean | null | undefined)[];
    }
}
