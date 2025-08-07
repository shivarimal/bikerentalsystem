import apiUrl from './apiUrl';

const API_BASE_URL = apiUrl + '/api';

// Create a payment intent for a booking
export const createPaymentIntent = async (bikeId: string, startTime: Date, endTime: Date) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `${token}`,
      },
      body: JSON.stringify({ bikeId, startTime, endTime }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment intent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Confirm successful payment and create booking
export const confirmPayment = async (paymentIntentId: string, pickupLocation?: { lat: number; lng: number }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/payment/payment-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `${token}`,
      },
      body: JSON.stringify({ 
        paymentIntentId,
        pickupLocation: pickupLocation || null
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to confirm payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};