// @ts-ignore
import { Override } from "framer"
import { formData } from "./shared/FormData"

function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        
        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
        }, wait);
    };
}

declare global {
    interface Window {
        google: any;
        stripeInstance: any;
        initMap: () => void;
        mapboxgl: any;
    }
}

declare const MapboxGeocoder: any;

const API_URL = "https://lawn-peak-api.onrender.com"

// Step 1: Name Input
export function withNameInput(): Override {
    return {
        onChange: event => {
            formData.name = event.target.value;
            console.log("Name:", formData.name);
        }
    }
}

// Step 2: Contact & Address Inputs
export function withPhoneInput(): Override {
    return {
        onChange: event => {
            formData.phone = event.target.value;
            console.log("Phone:", formData.phone);
        }
    }
}

export function withEmailInput(): Override {
    return {
        onChange: event => {
            formData.email = event.target.value;
            console.log("Email:", formData.email);
        }
    }
}

export function withAddressInput(): Override {
    return {
        onValueChange: {
            type: "enter",
            value: (value: string) => {
                console.log("Address value:", value);
                formData.address = value;
            }
        },
        value: formData.address || "",
        style: {
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "16px",
        },
        placeholder: "Enter your address..."
    }
}

// Step 3: Service Selection
export function withServiceSelect(): Override {
    return {
        onChange: async event => {
            try {
                const selectedService = event.target.value;
                formData.service = selectedService;
                console.log("Service selected:", selectedService);
                console.log("Current address:", formData.address);
                console.log("Current lot size:", formData.lotSize);

                if (!formData.address) {
                    console.log("Please enter your address first");
                    updatePriceDisplay("Please enter your address first");
                    return;
                }

                // Calculate price
                const basePrice = 30;
                const pricePerSqFt = 0.01;
                const calculatedPrice = basePrice + (formData.lotSize * pricePerSqFt);
                formData.price = Math.round(calculatedPrice);
                
                console.log("Calculated price:", formData.price);
                updatePriceDisplay(`$${formData.price}`);
            } catch (error) {
                console.error("Error:", error);
                updatePriceDisplay("Error calculating price");
            }
        }
    }
}

function updatePriceDisplay(text: string) {
    const priceDisplay = document.querySelector("[data-framer-name='PriceDisplay']");
    if (priceDisplay) {
        priceDisplay.textContent = text;
    }
}

// Next Button Logic
export function withNextButton(): Override {
    return {
        onClick: async () => {
            const form = document.querySelector("[data-framer-name='Form']");
            const currentStep = parseInt(form?.getAttribute("data-framer-component-active-variant") || "1");

            // Validate current step
            if (!validateStep(currentStep)) {
                return;
            }

            // Handle final step
            if (currentStep === 3) {
                try {
                    // Load Stripe dynamically
                    if (!window.stripeInstance) {
                        const stripeScript = document.createElement('script');
                        stripeScript.src = 'https://js.stripe.com/v3/';
                        document.head.appendChild(stripeScript);
                        
                        await new Promise((resolve, reject) => {
                            stripeScript.onload = () => {
                                window.stripeInstance = Stripe('pk_test_fYbv6F0yKXkfGVU6knKh7pZF00sXtoopsp');
                                resolve(null);
                            };
                            stripeScript.onerror = () => reject(new Error('Failed to load Stripe'));
                        });
                    }

                    const response = await fetch(`${API_URL}/api/create-payment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "Origin": "https://fabulous-screenshot-716470.framer.app"
                        },
                        body: JSON.stringify({
                            amount: formData.price * 100, // Convert to cents
                            customer: {
                                name: formData.name,
                                email: formData.email,
                                phone: formData.phone,
                                address: formData.address
                            },
                            service: formData.service
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Failed to create payment: ${errorText}`);
                    }

                    const data = await response.json();
                    console.log("Payment created:", data);
                } catch (error) {
                    console.error("Error creating payment:", error);
                }
            }
        }
    }
}

// Validation helper
function validateStep(step: number): boolean {
    switch (step) {
        case 1:
            return !!formData.name;
        case 2:
            return !!(formData.phone && formData.email && formData.address);
        case 3:
            return !!formData.service;
        default:
            return true;
    }
}
