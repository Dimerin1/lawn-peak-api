# Common Stripe Integration Issues and Solutions

This document lists common issues encountered with Stripe integration in the Lawn Peak project and their solutions.

## 1. Add Payment Method Button Not Working

### Symptoms
- Button click doesn't trigger any action
- No error messages in console
- Stripe checkout doesn't open

### Common Causes & Solutions

#### 1.1 Missing Stripe Publishable Key
**Issue:** Frontend can't initialize Stripe because the publishable key is not available.
**Solution:**
- Ensure `STRIPE_PUBLISHABLE_KEY` is set in `.env`
- Check that `/config` endpoint returns the key
- Verify key is being loaded in QuoteCalculator's useEffect

#### 1.2 CORS Issues
**Issue:** Backend requests blocked by CORS policy.
**Solution:**
- Ensure CORS is properly configured in Flask backend
- Check that all endpoints have proper CORS headers
- Verify API_BASE_URL matches the backend URL

#### 1.3 Form Validation
**Issue:** Form validation preventing submission but not showing errors.
**Solution:**
- Check all required fields are filled
- Ensure price calculation is complete
- Verify phone number format
- Log form data before submission

## 2. Stripe Payment Intent Issues

### Symptoms
- Payment setup starts but fails
- Error in Stripe Dashboard
- Customer created but no payment method attached

### Common Causes & Solutions

#### 2.1 Invalid Price Format
**Issue:** Price not properly formatted when creating payment intent.
**Solution:**
- Convert price to cents (multiply by 100)
- Ensure price is a valid number
- Use proper type conversion (parseFloat)
- Add validation before creating intent

#### 2.2 Missing Customer Metadata
**Issue:** Customer created without required metadata.
**Solution:**
- Ensure all required fields are in metadata:
  - service_type
  - address
  - lot_size
  - phone
  - price
- Convert all metadata values to strings

#### 2.3 Session URL Issues
**Issue:** Stripe checkout session URL not working.
**Solution:**
- Verify success_url and cancel_url are absolute URLs
- Include protocol (http/https)
- URL encode parameters
- Check for valid customer ID

## 3. Customer Data Issues

### Symptoms
- Missing or incorrect data in Admin Dashboard
- Price not showing correctly
- Payment status incorrect

### Common Causes & Solutions

#### 3.1 Price Display Issues
**Issue:** Price shows as 0 or invalid in dashboard.
**Solution:**
- Add price validation in backend
- Convert price to string in metadata
- Handle null/undefined price values
- Use proper number formatting

#### 3.2 Payment Method Status
**Issue:** Payment method status not updating.
**Solution:**
- Check Stripe webhook configuration
- Verify payment_method.attached event
- Update customer metadata after setup
- Handle webhook errors properly

## 4. Debug Tips

### Backend Debugging
```python
# Add these debug logs
logger.info(f"Customer {customer.id} metadata: {customer.metadata}")
logger.info(f"Original price: {customer.metadata.get('price')}")
logger.info(f"Formatted price: {metadata['price']}")
```

### Frontend Debugging
```typescript
// Add these console logs
console.log('Form data:', formData);
console.log('Setup intent response:', data);
console.log('Payment error:', error);
```

## 5. Prevention Best Practices

1. Always validate data before sending to Stripe
2. Use proper type conversion for numbers
3. Handle all possible error cases
4. Add comprehensive logging
5. Test with both test and live keys
6. Verify webhook configuration
7. Keep error messages user-friendly
8. Monitor Stripe Dashboard for issues
9. Use proper CORS configuration
10. Keep API keys secure

## 6. Quick Fixes

### Reset Stripe Integration
1. Clear local storage
2. Restart backend server
3. Check Stripe Dashboard
4. Verify webhook status
5. Test with new customer

### Fix Payment Button
1. Check browser console
2. Verify form data
3. Test API endpoints
4. Check CORS headers
5. Verify Stripe key
