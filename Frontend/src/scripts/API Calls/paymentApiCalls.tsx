import apiUrl from './apiUrl';
import logOut from '../logOut';

const API_BASE_URL = apiUrl + '/api/payment';

export const createPaymentIntent = async (bikeId: string, startTime: string, endTime: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `${token}`,
      },
      body: JSON.stringify({ bikeId, startTime, endTime }),
    });

    if (response.status === 401) {
      logOut();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const handlePaymentSuccess = async (paymentIntentId: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `${token}`,
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    if (response.status === 401) {
      logOut();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to complete payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};
