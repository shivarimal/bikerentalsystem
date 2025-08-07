# Stripe Integration Setup Guide

## Overview

This guide explains how to set up and test the Stripe payment integration in the Bike Rental System.

## Prerequisites

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

## Configuration

### Backend Configuration

1. Update the `.env` file in the Backend directory with your Stripe API keys:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

2. For webhook testing, you can use the Stripe CLI or create a webhook endpoint in your Stripe Dashboard.

```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend Configuration

1. Update the `.env` file in the Frontend directory with your Stripe publishable key:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## Testing Payments

### Test Cards

Use these test card numbers to simulate different payment scenarios:

- **Successful payment**: 4242 4242 4242 4242
- **Authentication required**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

For all test cards, you can use:
- Any future expiration date
- Any 3-digit CVC
- Any postal code

### Testing Flow

1. Browse available bikes
2. Select a bike and choose rental dates/times
3. Click "Book" to proceed to payment
4. Enter test card details
5. Complete the payment
6. Verify the booking in your profile

## Webhook Testing

To test webhooks locally:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login to your Stripe account: `stripe login`
3. Forward events to your local server: `stripe listen --forward-to http://localhost:5000/api/payment/webhook`
4. Use the webhook signing secret provided by the CLI in your `.env` file

## Production Considerations

1. Use production API keys when deploying to production
2. Set up proper error handling and logging
3. Implement additional security measures
4. Configure webhook endpoints in the Stripe Dashboard
5. Set up proper SSL/TLS for secure communication

## Troubleshooting

- Check browser console for frontend errors
- Check server logs for backend errors
- Verify API keys are correctly set in environment variables
- Ensure webhook signatures are being properly verified

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe.js and Elements](https://stripe.com/docs/js)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)