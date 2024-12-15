import { Override } from "framer"

const API_URL = "https://lawn-peak-api.onrender.com"

// Form data state
const formData = {
    name: "",
    email: "",
    phone: "",
    address: "",
    service: "",
    price: 0,
    lotSize: 0,
}

// Step 1: Name Input
export function withNameInput(): Override {
    return {
        onChange: (event) => {
            formData.name = event.target.value
            console.log("Name:", formData.name)
        },
    }
}

// Step 2: Contact & Address Inputs
export function withPhoneInput(): Override {
    return {
        onChange: (event) => {
            formData.phone = event.target.value
            console.log("Phone:", formData.phone)
        },
    }
}

export function withEmailInput(): Override {
    return {
        onChange: (event) => {
            formData.email = event.target.value
            console.log("Email:", formData.email)
        },
    }
}

export function withAddressInput(): Override {
    return {
        onPlaceSelect: async (place) => {
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
                    mode: "cors",
                    credentials: "include",
                    body: JSON.stringify({
                        address: formData.address,
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                    }),
                })

                if (!response.ok) {
                    console.error("Server response:", await response.text())
                    throw new Error(`Failed to fetch lot size: ${response.status}`)
                }
                
                const data = await response.json()
                formData.lotSize = data.lot_size
                console.log("Lot Size:", formData.lotSize)
            } catch (error) {
                console.error("Error fetching lot size:", error)
            }
        },
    }
}

// Step 3: Service Selection
export function withServiceSelect(): Override {
    return {
        onChange: async (event) => {
            formData.service = event.target.value
            console.log("Service:", formData.service)

            try {
                if (!formData.lotSize) {
                    throw new Error("Please enter your address first to calculate the lot size")
                }

                const response = await fetch(`${API_URL}/api/calculate-price`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Origin": "https://fabulous-screenshot-716470.framer.app"
                    },
                    mode: "cors",
                    credentials: "include",
                    body: JSON.stringify({
                        lot_size: formData.lotSize,
                        service: formData.service,
                    }),
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error("Server response:", errorText)
                    throw new Error(`Failed to calculate price: ${errorText}`)
                }

                const data = await response.json()
                formData.price = data.price
                console.log("Price:", formData.price)

                // Update price display if it exists
                const priceDisplay = document.querySelector("[data-framer-name='PriceDisplay']")
                if (priceDisplay) {
                    priceDisplay.textContent = `$${formData.price}`
                }
            } catch (error) {
                console.error("Error calculating price:", error)
                const priceDisplay = document.querySelector("[data-framer-name='PriceDisplay']")
                if (priceDisplay) {
                    priceDisplay.textContent = "Error calculating price"
                }
                throw error
            }
        },
    }
}

// Next Button Logic
export function withNextButton(): Override {
    return {
        onClick: async () => {
            const form = document.querySelector("[data-framer-name='Form']")
            const currentStep = parseInt(
                form?.getAttribute("data-framer-component-active-variant") || "1"
            )

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
                        mode: "cors",
                        credentials: "include",
                        body: JSON.stringify({
                            amount: formData.price,
                            customer: {
                                name: formData.name,
                                email: formData.email,
                                phone: formData.phone,
                                address: formData.address,
                            },
                            service: formData.service,
                        }),
                    })

                    if (!response.ok) {
                        console.error("Server response:", await response.text())
                        throw new Error(`Failed to create payment: ${response.status}`)
                    }

                    const { clientSecret } = await response.json()
                    
                    // Initialize Stripe payment here if needed
                    // This would depend on your Stripe implementation
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
        visible: false, // You can control this based on API calls
    }
}

// Optional: Add error message overrides
export function withErrorMessage(): Override {
    return {
        visible: false,
        text: "", // You can update this with specific error messages
    }
}
