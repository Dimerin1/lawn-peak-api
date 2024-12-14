# Lawn Peak - Lawn Care Quote Calculator

A comprehensive solution for calculating lawn care quotes based on property size and processing payments through Stripe.

## Features
- Address-based lot size calculation
- Automatic price calculation with margins
- Secure payment processing with Stripe
- Google Sheets integration for data storage

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your API keys:
   - Google Maps API key
   - Stripe API keys
   - Google Sheets configuration

4. Set up Google Sheets:
   - Enable Google Sheets API in Google Cloud Console
   - Create service account and download credentials
   - Share your Google Sheet with the service account email

5. Set up Stripe:
   - Create a Stripe account
   - Get API keys from dashboard
   - Configure webhook endpoints

## Running the Application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Testing

Run the test suite:
```bash
python -m pytest
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
