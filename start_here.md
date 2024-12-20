# Lawn Peak - Professional Lawn Care Service Platform

## Project Overview
Lawn Peak is a sophisticated lawn care service platform that automates quote calculations and payment processing. The system uses property size and service frequency to determine pricing, integrating with Stripe for secure payments and Google services for data management and customer communications.

## Core Features

### 1. Smart Quote Calculator
- **Address Validation & Lot Size Detection**
  - Google Places API integration for accurate addresses
  - Automatic lot size calculation based on property boundaries
  - Support for manual lot size selection

- **Dynamic Pricing System**
  - Base pricing tiers:
    - Small (up to 5,000 sq ft): $60 base
    - Medium (5,000 - 10,000 sq ft): $70 base
    - Large (10,000 - 15,000 sq ft): $75 base
    - Extra Large (over 15,000 sq ft): $80 base
  
  - Service Frequency Discounts:
    - One-time mowing (standard price)
    - Weekly mowing (20% discount)
    - Bi-Weekly mowing (10% discount)
    - Monthly mowing (standard price)

- **Service Inclusions**
  - Professional mowing
  - Edge trimming
  - Grass clippings cleanup

### 2. Payment Processing
- **Stripe Integration**
  - Secure payment method storage
  - Support for recurring billing
  - Pre-authorization and final payment capture
  - Production-ready with live/test mode configuration

- **Payment Features**
  - Automatic recurring billing for subscription services
  - Manual charging capability through admin dashboard
  - Payment status tracking
  - Automatic receipt generation

### 3. Admin Dashboard
- **Customer Management**
  - Comprehensive customer list view
  - Search and filtering capabilities
  - Payment status tracking
  - Service history

- **Operations**
  - Manual payment processing
  - Customer data management
  - Service scheduling
  - Email communication

### 4. Data Management
- **Google Sheets Integration**
  - Real-time quote storage
  - Customer information management
  - Payment tracking
  - Service history logging

- **Email Notifications**
  - Quote submission confirmations
  - Payment receipts
  - Service reminders
  - Custom notifications via Google Apps Script

## Technical Architecture

### Frontend (React/Next.js)
- **Key Components**
  - `QuoteCalculator.tsx`: Main quote generation interface
  - `AdminDashboard.tsx`: Administrative control panel
  - `NameInput.tsx`: Customer information collection
  - Components/: Reusable UI components

- **UI/UX Features**
  - Responsive design
  - Modern, clean interface
  - Interactive pricing updates
  - Real-time validation

### Backend (Python/Flask)
- **Core Functionality**
  - RESTful API endpoints
  - Stripe payment processing
  - Google services integration
  - Email notification system

- **Key Files**
  - `app.py`: Main application logic
  - `frontend.py`: Frontend route handlers
  - `emailNotification.gs`: Google Apps Script for emails
  - `test_app.py`: Unit tests

### Infrastructure
- **Deployment Options**
  - Docker containerization
  - Railway deployment support
  - Render platform compatibility

- **Security**
  - CORS configuration
  - Environment-based secrets
  - Secure API key management

## Environment Setup

### Prerequisites
1. Python 3.8+
2. Node.js 14+
3. Google Cloud account
4. Stripe account

### Configuration Files
- `.env`: Environment variables
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  GOOGLE_SHEETS_ID=...
  ADMIN_PASSWORD=...
  ```
- `google-credentials.json`: Google service account credentials
- `requirements.txt`: Python dependencies
- `package.json`: Node.js dependencies

### Installation Steps
1. Clone repository
2. Install Python dependencies: `pip install -r requirements.txt`
3. Install Node.js dependencies: `npm install`
4. Configure environment variables
5. Set up Google credentials
6. Configure Stripe webhooks

## Development Workflow
1. Frontend development server: `npm run dev` (port 3000)
2. Backend API server: `python app.py` (port 8080)
3. Test environment: `npm test` / `python -m pytest`

## Security Notes
- Stripe keys must be properly configured for test/live modes
- Google credentials require specific API permissions
- Admin access is protected by environment variable password
- All sensitive data is stored in Google Sheets, not locally
