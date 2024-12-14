# Lawn Peak - Lawn Care Quote Calculator

## Project Overview
A complete solution for integrating address-based quotes and Stripe payment processing.

## Components

### 1. Address Input & Lot Size Calculation
- [x] Google Sheets Integration (Spreadsheet ID: 19AqlhJ54zBXsED3J3vkY8_WolSnundLakNdfBAJdMXA)
- [x] Google Geocoding API Integration
- [x] Lot Size Calculation System

### 2. Price Calculation
- [x] Base Price Calculation (lot_size * $0.003843)
- [x] Minimum Price Check ($30)
- [x] Margin Application (70%)
- [x] Round prices to whole numbers

### 3. Stripe Integration
- [x] Stripe Elements Setup
- [x] Payment Pre-authorization
- [x] Final Payment Capture

## Function Definitions

### `getLotSizeFromAddress(address: string)`
- Input: Street address
- Output: Lot size in square feet
- Purpose: Convert address to coordinates and retrieve lot size
- Status: 

### `calculatePrice(lotSize: number)`
- Input: Lot size in square feet
- Output: Final price (whole number)
- Purpose: Calculate quote based on lot size with minimum price and margin
- Status: 

### `createPaymentIntent(amount: number)`
- Input: Final quote amount
- Output: Stripe PaymentIntent object
- Purpose: Pre-authorize payment card
- Status: 

### `capturePayment(paymentIntentId: string)`
- Input: PaymentIntent ID
- Output: Payment confirmation
- Purpose: Complete the payment after job completion
- Status: 

## API Keys Required
- Google Geocoding API
- Stripe API
- Google Sheets API

## Tech Stack
- Frontend: HTML, CSS, JavaScript with Tailwind CSS
- Backend: Python/Flask
- Payment Processing: Stripe
- Data Storage: Google Sheets

## Framer-API Integration

### User Flow & API Integration Points

#### Step 1: Customer Information
- Collect customer name
- Store in Framer state for next steps
- No API call required

#### Step 2: Contact & Address
- Collect: phone, email, address
- API Endpoint: `POST /api/lot-size`
  ```json
  {
    "address": "string",
    "name": "string",
    "email": "string",
    "phone": "string"
  }
  ```
- Response: `{ "lot_size": number }`
- Error Handling: Invalid address, API timeout

#### Step 3: Service Selection
- Display service dropdown
- API Endpoint: `POST /api/calculate-price`
  ```json
  {
    "lot_size": number,
    "service": string
  }
  ```
- Response: `{ "price": number }`

#### Step 4: Payment Processing
- API Endpoint: `POST /api/create-payment`
  ```json
  {
    "amount": number,
    "customer": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "address": "string"
    },
    "service": "string"
  }
  ```
- Response: `{ "clientSecret": string }`
- Implement Stripe Elements for secure payment
- Success/failure handling and Google Sheets update

### API Error Handling
- Network timeout: Retry with exponential backoff
- Invalid input: Clear validation messages
- API errors: User-friendly error messages
- Payment failures: Detailed error feedback

### Loading States
- Address validation: "Calculating lot size..."
- Price calculation: "Calculating quote..."
- Payment processing: "Processing payment..."

### Data Flow
1. Store user inputs in Framer state
2. Pass complete data object between steps
3. Validate all required fields before API calls
4. Maintain error state for proper user feedback

## Deployment
- [x] Backend API deployed on Render (lawn-peak-api)
- [ ] Framer site configuration
  - Add API endpoint URLs
  - Configure CORS settings
  - Set up error handling
- [x] SSL certificate
- [ ] Domain configuration
- [ ] End-to-end testing
  - Address validation flow
  - Price calculation accuracy
  - Payment processing
  - Google Sheets integration

## Testing Instructions
- [x] Local environment setup
- [x] API key configuration
- [x] Test address validation
- [x] Test price calculation
- [ ] Test payment flow
