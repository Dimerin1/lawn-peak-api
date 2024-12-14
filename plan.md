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
- Status: ✅ Implemented

### `capturePayment(paymentIntentId: string)`
- Input: PaymentIntent ID
- Output: Payment confirmation
- Purpose: Complete the payment after job completion
- Status: ✅ Implemented

## API Keys Required
- Google Geocoding API
- ✅ Stripe API
- Google Sheets API

## Tech Stack
- Frontend: HTML, CSS, JavaScript with Tailwind CSS
- Backend: Python/Flask
- Payment Processing: Stripe
- Data Storage: Google Sheets

## Testing Instructions
- [x] Local environment setup
- [x] API key configuration
- [x] Test address validation
- [x] Test price calculation
- [ ] Test payment flow

## Deployment
- [ ] Environment setup
- [ ] API configuration
- [ ] SSL certificate
- [ ] Domain configuration
