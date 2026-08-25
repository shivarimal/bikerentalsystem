import dotenv from 'dotenv';

dotenv.config();

export function getKhaltiConfig() {
    const secretKey = process.env.KHALTI_SECRET_KEY;
    const apiUrl = (process.env.KHALTI_API_URL || 'https://dev.khalti.com/api/v2').replace(/\/+$/, '');
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

    if (!secretKey) {
        return null;
    }

    return { secretKey, apiUrl, frontendUrl, backendUrl };
}
