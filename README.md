# Bike Rental System

A full-stack application for renting bikes with integrated Stripe payment processing.

## Features

- User authentication and authorization
- Bike listing and management
- Booking system with date and time selection
- Secure payment processing with Stripe
- Booking history and management
- Admin dashboard for system management

## Tech Stack

### Frontend
- React with TypeScript
- React Router for navigation
- Stripe Elements for payment UI
- Bootstrap for styling

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Stripe API for payment processing

## Setup Instructions

### Prerequisites
- Node.js and npm
- MongoDB
- Stripe account

### Environment Variables

#### Backend (.env)
```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Frontend (.env)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```
   cd Backend
   npm install
   cd ../Frontend
   npm install
   ```
3. Start the backend server:
   ```
   cd Backend
   npm start
   ```
4. Start the frontend development server:
   ```
   cd Frontend
   npm run dev
   ```

## Payment Flow

1. User selects a bike and booking dates/times
2. User is redirected to the payment page
3. User enters payment details using Stripe Elements
4. On successful payment, the booking is confirmed
5. User can view booking details in their profile

## Stripe Testing

Use the following test card numbers for testing:

- Successful payment: 4242 4242 4242 4242
- Failed payment: 4000 0000 0000 0002

Use any future expiration date, any 3-digit CVC, and any postal code.# bikerentalsystem
