import apiUrl from './apiUrl';
import logOut from '../logOut';

const API_BASE_URL = apiUrl + '/api/payment';

export const initiateKhaltiPayment = async (bookingId: string) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/khalti/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `${token}`,
            },
            body: JSON.stringify({ bookingId }),
        });

        if (response.status === 401) {
            logOut();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            let errorMessage = 'Failed to initiate Khalti payment';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
                const text = await response.text();
                errorMessage = text || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Error initiating Khalti payment:', error);
        throw error;
    }
};

export const verifyKhaltiPayment = async (pidx: string) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/khalti/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `${token}`,
            },
            body: JSON.stringify({ pidx }),
        });

        if (response.status === 401) {
            logOut();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            let errorMessage = 'Failed to verify Khalti payment';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
                const text = await response.text();
                errorMessage = text || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Error verifying Khalti payment:', error);
        throw error;
    }
};
