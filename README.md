# Bike Rental System

A full-stack application for renting bikes with integrated Khalti payment processing.

## Features

- User authentication and authorization
- Bike listing and management
- Booking system with date and time selection
- Secure payment processing with Khalti
- Booking history and management
- Admin dashboard for system management

## Tech Stack

### Frontend
- React with TypeScript
- React Router for navigation
- Khalti KPG-2 Web Checkout for payment
- Bootstrap for styling

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Khalti API for payment processing

## Setup Instructions

### Prerequisites
- Node.js and npm
- MongoDB
- Khalti developer account (https://dev.khalti.com)

### Environment Variables

#### Backend (.env)
```
KHALTI_SECRET_KEY=your_sandbox_secret_key
KHALTI_API_URL=https://dev.khalti.com/api/v2
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
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
   npm run dev
   ```
4. Start the frontend development server:
   ```
   cd Frontend
   npm run dev
   ```

## Payment Flow

1. User selects a bike and booking dates/times
2. User is redirected to the payment page
3. User clicks "Pay with Khalti"
4. Backend creates a pending booking and initiates Khalti payment
5. User completes payment on Khalti's payment page
6. Khalti redirects back to the callback URL
7. Backend verifies payment via Khalti lookup API
8. On successful verification, the booking is confirmed
9. User is redirected to their profile page
