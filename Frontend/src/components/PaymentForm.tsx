import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment } from '../scripts/API Calls/paymentApiCalls';
import MapComponent from './MapComponent';
import './PaymentForm.css';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  bikeId: string;
  startTime: Date;
  endTime: Date;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Location {
  lat: number;
  lng: number;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({ 
  bikeId, 
  startTime, 
  endTime, 
  amount, 
  onSuccess, 
  onCancel 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);

  useEffect(() => {
    // Create a payment intent when the component mounts
    const fetchPaymentIntent = async () => {
      try {
        setLoading(true);
        const { clientSecret } = await createPaymentIntent(bikeId, startTime, endTime);
        setClientSecret(clientSecret);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [bikeId, startTime, endTime]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    if (!pickupLocation) {
      setError('Please select a pickup location on the map');
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
        // You can add metadata about the pickup location if needed
        // metadata: {
        //   pickupLat: pickupLocation.lat.toString(),
        //   pickupLng: pickupLocation.lng.toString()
        // }
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, now confirm with our backend
        // You can pass the pickup location to your backend here
        await confirmPayment(paymentIntent.id, pickupLocation);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-group mb-4">
        <label className="form-label">Select Pickup Location</label>
        <div className="map-container mb-3">
          <MapComponent 
            onLocationSelect={setPickupLocation} 
            height="250px"
          />
          {pickupLocation && (
            <div className="mt-2 text-success">
              <small>Pickup location selected: {pickupLocation.lat.toFixed(6)}, {pickupLocation.lng.toFixed(6)}</small>
            </div>
          )}
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">Card Details</label>
        <div className="card-element-container p-3 border rounded">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="d-flex justify-content-between mt-4">
        <button 
          type="button" 
          className="btn btn-outline-secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={!stripe || loading || !pickupLocation}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            `Pay ₹${amount}`
          )}
        </button>
      </div>
    </form>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <div className="payment-container">
      <div className="card bg-glass bg-mid-white p-4">
        <h3 className="mb-4">Complete Your Payment</h3>
        <div className="mb-4">
          <p><strong>Bike:</strong> {props.bikeId}</p>
          <p><strong>Start Time:</strong> {props.startTime.toLocaleString()}</p>
          <p><strong>End Time:</strong> {props.endTime.toLocaleString()}</p>
          <p><strong>Total Amount:</strong> ₹{props.amount}</p>
        </div>
        <Elements stripe={stripePromise}>
          <CheckoutForm {...props} />
        </Elements>
      </div>
    </div>
  );
};

export default PaymentForm;