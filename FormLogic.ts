import { Override } from "framer"

const API_URL = "https://lawn-peak-api.onrender.com"

// Initialize form data
const formData = {
    name: '',
    phone: '',
    email: '',
    address: '',
    lotSize: 0,
    service: '',
    price: 0,
    clientSecret: ''
}

// Initialize Stripe only when needed
let stripe: any = null;
let elements: any = null;

async function initializeStripe() {
    if (!stripe) {
        stripe = await loadStripe('pk_test_51OPwkqJR3YXWVEFxwsqxL8Y4WbPxgLHxDpQGwFxPVtpxBVNCwkQzbtLKxPUzlHWBELHbkWxXTLRPWfbFGHmV4Ygx00jrJYHRsD');
    }
    return stripe;
}

async function initializeElements() {
    if (!elements) {
        const stripe = await initializeStripe();
        elements = stripe.elements();
    }
    return elements;
}

// Form data state

// Step 1: Name Input
export function withNameInput(): Override {
    return {
        onChange: event => {
            formData.name = event.target.value
            console.log("Name:", formData.name)
        },
    }
}

// Step 2: Contact & Address Inputs
export function withPhoneInput(): Override {
    return {
        onChange: event => {
            formData.phone = event.target.value
            console.log("Phone:", formData.phone)
        },
    }
}

export function withEmailInput(): Override {
    return {
        onChange: event => {
            formData.email = event.target.value
            console.log("Email:", formData.email)
        },
    }
}

export function withAddressInput(): Override {
    return {
        onPlaceSelect: async place => {
            formData.address = place.address
            console.log("Address:", formData.address)
            
            try {
                const response = await fetch(`${API_URL}/api/lot-size`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Origin": "https://fabulous-screenshot-716470.framer.app"
                    },
                    body: JSON.stringify({
                        address: formData.address
                    }),
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error("Lot size error response:", errorText)
                    throw new Error(`Failed to fetch lot size: ${errorText}`)
                }
                
                const data = await response.json()
                formData.lotSize = data.lot_size
                console.log("Lot Size set to:", formData.lotSize)
            } catch (error) {
                console.error("Error fetching lot size:", error)
                formData.lotSize = 0 // Reset lot size on error
                throw error
            }
        },
    }
}

// Step 3: Service Selection
export function withServiceSelect(): Override {
    return {
        onChange: async event => {
            try {
                const selectedService = event.target.value
                formData.service = selectedService
                console.log("Service selected:", selectedService)

                if (!formData.lotSize) {
                    const error = new Error("Please enter your address first to calculate the lot size")
                    console.error(error.message)
                    updatePriceDisplay(error.message)
                    return
                }

                console.log("Calculating price with lot size:", formData.lotSize)
                const requestBody = {
                    lot_size: Number(formData.lotSize), // Ensure lot_size is a number
                    service: selectedService.toLowerCase() // Convert service to lowercase
                }
                console.log("Sending price calculation request:", requestBody)

                const response = await fetch(`${API_URL}/api/calculate-price`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Origin": "https://fabulous-screenshot-716470.framer.app"
                    },
                    body: JSON.stringify(requestBody)
                })

                const responseText = await response.text()
                console.log("Raw response:", responseText)

                if (!response.ok) {
                    throw new Error(responseText || "Failed to calculate price")
                }

                const data = JSON.parse(responseText)
                formData.price = data.price
                console.log("Price calculated:", formData.price)
                updatePriceDisplay(`$${formData.price}`)
            } catch (error) {
                console.error("Error in price calculation:", error)
                updatePriceDisplay(error.message || "Error calculating price")
            }
        }
    }
}

function updatePriceDisplay(text: string) {
    const priceDisplay = document.querySelector("[data-framer-name='PriceDisplay']")
    if (priceDisplay) {
        priceDisplay.textContent = text
    }
}

// Step 4: Payment Form
export function withPaymentForm(): Override {
    return {
        onLoad: async () => {
            try {
                if (!formData.price || !formData.service) {
                    console.log("Price or service not set yet, skipping payment form initialization");
                    return;
                }

                const elements = await initializeElements();
                const paymentElement = elements.create('payment');
                paymentElement.mount('#payment-element');
            } catch (error) {
                console.error("Error initializing payment form:", error);
            }
        }
    }
}

// Submit payment handler
export async function handlePaymentSubmit(event: any) {
    event.preventDefault();
    
    try {
        if (!formData.price) {
            throw new Error("Please select a service and get a price quote first");
        }

        const stripe = await initializeStripe();
        
        // Create payment intent
        const response = await fetch(`${API_URL}/api/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'https://fabulous-screenshot-716470.framer.app'
            },
            body: JSON.stringify({
                amount: formData.price * 100, // Convert to cents
                service: formData.service,
                customer: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address
                }
            })
        });

        const { clientSecret } = await response.json();
        formData.clientSecret = clientSecret;

        // Confirm payment
        const { error } = await stripe.confirmPayment({
            elements: await initializeElements(),
            clientSecret,
            confirmParams: {
                return_url: 'https://fabulous-screenshot-716470.framer.app/success',
            },
        });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error("Payment error:", error);
        const message = error.message || "An error occurred during payment";
        alert(message);
    }
}

// Next Button Logic
export function withNextButton(): Override {
    return {
        onClick: async () => {
            const form = document.querySelector("[data-framer-name='Form']")
            const currentStep = parseInt(form?.getAttribute("data-framer-component-active-variant") || "1")

            // Validate current step
            if (!validateStep(currentStep)) {
                return
            }

            // Handle final step
            if (currentStep === 3) {
                try {
                    const response = await fetch(`${API_URL}/api/create-payment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "Origin": "https://fabulous-screenshot-716470.framer.app"
                        },
                        body: JSON.stringify({
                            amount: formData.price,
                            customer: {
                                name: formData.name,
                                email: formData.email,
                                phone: formData.phone,
                                address: formData.address
                            },
                            service: formData.service
                        })
                    })

                    if (!response.ok) {
                        const errorText = await response.text()
                        throw new Error(`Failed to create payment: ${errorText}`)
                    }

                    const { clientSecret } = await response.json()
                    console.log("Payment initiated with client secret:", clientSecret)
                } catch (error) {
                    console.error("Error creating payment:", error)
                }
            }
        },
    }
}

// Validation helper
function validateStep(step: number): boolean {
    switch (step) {
        case 1:
            return !!formData.name
        case 2:
            return !!(formData.phone && formData.email && formData.address)
        case 3:
            return !!formData.service
        default:
            return true
    }
}

// Optional: Add loading state overrides
export function withLoadingIndicator(): Override {
    return {
        visible: false,
    }
}

// Optional: Add error message overrides
export function withErrorMessage(): Override {
    return {
        visible: false,
        text: "",
    }
}
