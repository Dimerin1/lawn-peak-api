import { Override } from "framer"

const API_URL = "https://lawn-peak-api.onrender.com"

// Initialize form data
const formData = {
    name: "",
    email: "",
    phone: "",
    address: "",
    service: "",
    price: 0,
    lotSize: 0
}

// Step 1: Name Input
export function withNameInput(): Override {
    return {
        onChange: event => {
            formData.name = event.target.value
            console.log("Name:", formData.name)
        }
    }
}

// Step 2: Contact & Address Inputs
export function withPhoneInput(): Override {
    return {
        onChange: event => {
            formData.phone = event.target.value
            console.log("Phone:", formData.phone)
        }
    }
}

export function withEmailInput(): Override {
    return {
        onChange: event => {
            formData.email = event.target.value
            console.log("Email:", formData.email)
        }
    }
}

export function withAddressInput(): Override {
    return {
        onPlaceSelect: async place => {
            try {
                formData.address = place.address
                console.log("Address:", formData.address)

                const response = await fetch(`${API_URL}/api/lot-size`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Origin": "https://fabulous-screenshot-716470.framer.app"
                    },
                    body: JSON.stringify({
                        address: formData.address
                    })
                })

                const responseText = await response.text()
                console.log("Lot size response:", responseText)

                if (!response.ok) {
                    throw new Error(responseText || "Failed to fetch lot size")
                }

                const data = JSON.parse(responseText)
                formData.lotSize = Number(data.lot_size)
                console.log("Lot Size set to:", formData.lotSize)
            } catch (error) {
                console.error("Error fetching lot size:", error)
                formData.lotSize = 0
            }
        }
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
                    const error = new Error("Please enter your address first")
                    console.error(error.message)
                    updatePriceDisplay(error.message)
                    return
                }

                const requestBody = {
                    lot_size: Number(formData.lotSize),
                    service: selectedService.toLowerCase()
                }
                console.log("Price calculation request:", requestBody)

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
                console.log("Price calculation response:", responseText)

                if (!response.ok) {
                    throw new Error(responseText || "Failed to calculate price")
                }

                const data = JSON.parse(responseText)
                formData.price = data.price
                console.log("Price set to:", formData.price)
                updatePriceDisplay(`$${formData.price}`)
            } catch (error) {
                console.error("Error calculating price:", error)
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
                            amount: formData.price * 100, // Convert to cents
                            customer: {
                                name: formData.name,
                                email: formData.email,
                                phone: formData.phone,
                                address: formData.address
                            },
                            service: formData.service
                        })
                    })

                    const responseText = await response.text()
                    console.log("Payment response:", responseText)

                    if (!response.ok) {
                        throw new Error(responseText || "Failed to create payment")
                    }

                    const data = JSON.parse(responseText)
                    console.log("Payment created:", data)
                } catch (error) {
                    console.error("Error creating payment:", error)
                }
            }
        }
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
        visible: false
    }
}

// Optional: Add error message overrides
export function withErrorMessage(): Override {
    return {
        visible: false,
        text: ""
    }
}
