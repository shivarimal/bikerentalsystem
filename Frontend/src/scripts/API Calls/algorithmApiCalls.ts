import apiUrl from './apiUrl';

const API_BASE_URL = apiUrl + '/api/algorithm';

export const trainAlgorithm = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to train algorithm');
    }

    return await response.json();
  } catch (error) {
    console.error('Error training algorithm:', error);
    throw error;
  }
};

export const predictPrice = async (cc: number, horsePower: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cc, horsePower })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to predict price');
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting price:', error);
    throw error;
  }
};

export const getAlgorithmInfo = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get algorithm info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting algorithm info:', error);
    throw error;
  }
};
