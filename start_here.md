# Lawn Peak - Project Documentation

## Project Overview
Lawn Peak is a full-stack lawn care service platform that provides automated quote calculations, payment processing, and service scheduling. The system integrates multiple services including Stripe for payments, Google Sheets for data storage, and Google Maps for address validation.

## Architecture

### Backend (Flask)
- **Framework**: Flask 2.0.1
- **Entry Point**: `app.py`
- **Key Dependencies**:
  - `flask-cors`: Handles CORS for frontend communication
  - `stripe`: Payment processing
  - `google-api-python-client`: Google Sheets integration
  - `python-dotenv`: Environment variable management

### Frontend (Next.js)
- **Framework**: Next.js 14.0.0
- **Language**: TypeScript
- **Key Components**:
  - `QuoteCalculator.tsx`: Main quote calculation interface
  - `AdminDashboard.tsx`: Admin interface for customer management
  - `NameInput.tsx`: Customer information collection

## Core Features

### 1. Quote Calculator
- **Location**: `QuoteCalculator.tsx`
- **Flow**:
  1. Customer enters address (Google Places Autocomplete)
  2. System calculates lot size
  3. Customer selects service type
  4. Price is calculated based on lot size and service type
  5. Payment is processed through Stripe

### 2. Payment Processing
- **Implementation**: `app.py`
- **Key Endpoints**:
  - `/create-payment-intent`: Creates Stripe payment intent
  - `/create-setup-intent`: Handles recurring payment setup
  - `/webhook`: Processes Stripe webhooks
- **Features**:
  - One-time payments
  - Recurring payments (weekly/bi-weekly/monthly)
  - Payment metadata tracking

### 3. Google Sheets Integration
- **Purpose**: Customer data and quote storage
- **Implementation**: `app.py` (append_to_sheet function)
- **Data Stored**:
  - Timestamp
  - Customer Name
  - Email
  - Service Type
  - Phone Number
  - Address
  - Lot Size
  - Price
  - Charged Date
  - Start Date

### 4. Admin Dashboard
- **Location**: `AdminDashboard.tsx`
- **Features**:
  - Customer list view
  - Payment status tracking
  - Service management
  - Customer charging functionality

## Database Structure

### SQLite Database (payments.db)
- Used for local data storage
- Stores customer and payment information
- Future: Will store referral system data

## API Endpoints

### Quote Management
- `POST /submit-quote`: Submit new quote
- `GET /lot-size`: Get lot size for address

### Payment
- `POST /create-payment-intent`: Initialize payment
- `POST /create-setup-intent`: Setup recurring payment
- `POST /webhook`: Handle Stripe events
- `POST /charge-customer`: Process customer charges

### Admin
- `POST /admin/login`: Admin authentication
- `GET /customers`: List all customers

## Environment Variables
```
# Stripe Configuration
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Google API Configuration
GOOGLE_MAPS_API_KEY=...
GOOGLE_SHEETS_PRIVATE_KEY_ID=...
GOOGLE_SHEETS_PRIVATE_KEY=...
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_CLIENT_ID=...
GOOGLE_SHEETS_CLIENT_X509_CERT_URL=...

# Admin Configuration
ADMIN_PASSWORD=...

# Database Configuration
MONGODB_URI=... (configured but not currently used)
```

## Deployment

### Platform: Render
- **Configuration**: `render.yaml`
- **Services**:
  1. lawn-peak-api (Python/Flask)
     - Port: 10000
     - Environment: Python 3.9.0
  2. lawn-peak-front (Node.js/Next.js)
     - Port: 3000
     - Environment: Node.js

### Environment Setup
- Environment variables managed through Render dashboard
- Separate configurations for API and frontend services
- Automatic deployments on push to main branch

## Pricing Logic

### Base Calculation
- Base price: $30
- Area-based pricing: $0.01 per sq ft

### Service Discounts
- One-time mowing: Standard price
- Weekly mowing: 30% discount
- Bi-Weekly mowing: 20% discount
- Monthly mowing: Standard price

## Security Measures
1. Environment variables for sensitive data
2. CORS configuration for API access
3. Admin authentication
4. Secure payment processing through Stripe
5. Google API service account with limited permissions

## Integration Points
1. Frontend → Backend API communication
2. Stripe payment processing
3. Google Maps address validation
4. Google Sheets data storage
5. Admin dashboard → customer management

## Common Operations

### Adding New Customer
1. Customer fills quote calculator
2. Data validated and processed
3. Payment processed through Stripe
4. Information stored in Google Sheets
5. Customer record created in database

### Processing Payments
1. Create payment intent
2. Collect payment method
3. Process payment
4. Update payment status
5. Record transaction in sheets

### Admin Tasks
1. View customer list
2. Process charges
3. Manage service schedules
4. Track payment status

## Error Handling
- Detailed logging throughout the application
- Error responses include specific messages
- Frontend error display for user feedback
- Payment error handling through Stripe
- API error status codes and messages

## Future Considerations
1. MongoDB integration (configured but not implemented)
2. Enhanced analytics
3. Email notification system
4. Referral system implementation
5. Advanced customer management features
