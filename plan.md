# Lawn Peak - Lawn Care Quote Calculator

## Project Overview
A complete solution for integrating address-based quotes and Stripe payment processing.

## Components

### 1. Address Input & Service Selection
- [x] Google Places Autocomplete Integration
- [x] Address Validation
- [x] Service Selection Component
- [x] State Management between Components
- [ ] Real Lot Size Calculation (currently using default 5000 sq ft)

### 2. Price Calculation
- [x] Base Price Implementation ($30 base)
- [x] Area-based Pricing ($0.01 per sq ft)
- [x] Service-specific Discounts
  - [x] One-time mowing (standard price)
  - [x] Weekly mowing (30% discount)
  - [x] Bi-Weekly mowing (20% discount)
  - [x] Monthly mowing (standard price)
- [x] Price Display with Discount Information
- [x] Per-service Price Indication

### 3. Form Flow
- [x] Address Input Validation
- [x] Service Selection Validation
- [x] Price Calculation Integration
- [ ] Error Handling Improvements
- [ ] Loading States

### 4. Stripe Integration (Pending)
- [ ] Stripe Elements Setup
- [ ] Payment Pre-authorization
- [ ] Final Payment Capture
- [ ] Recurring Payment Setup for Weekly/Bi-Weekly/Monthly Services

## Components Structure

### `QuoteCalculator`
- Main component managing form state and logic
- Handles data flow between child components
- Manages price calculations with discounts
- Status: 

### `AddressInput`
- Google Places Autocomplete integration
- Address validation and formatting
- Lot size assignment (currently default)
- Status: 

### `ServiceSelect`
- Service options with frequency selection
- Discount application based on frequency
- Price calculation with discounts
- Status: 

## Next Steps

1. Integrate real lot size calculation
2. Implement loading states and error handling
3. Set up Stripe payment integration
   - One-time payments for single service
   - Recurring payments for subscription services
4. Add form completion and submission flow
5. Add service scheduling interface

## API Keys Required
- Google Places API (Implemented)
- Google Maps API (Pending for lot size)
- Stripe API (Pending for payments)

## Notes
- Currently using a default lot size of 5000 sq ft
- Base price calculation: $30 base + ($0.01 * lot size)
- Service discounts:
  - Weekly: 30% off base price
  - Bi-Weekly: 20% off base price
  - Monthly/One-time: No discount
- All components working in Framer
- Successfully resolved state management issues

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
