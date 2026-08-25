import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Menubar from './Menubar';
import { initiateKhaltiPayment } from '../scripts/API Calls/khaltiApiCalls';

const PaymentPage: React.FC = (): JSX.Element => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [khaltiLoading, setKhaltiLoading] = useState(false);

    const bikeId = searchParams.get('bikeId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const amount = searchParams.get('amount');

    useEffect(() => {
        if (!bikeId || !startTime || !endTime) {
            setError('Missing booking details. Please go back and try again.');
        }
        setLoading(false);
    }, [bikeId, startTime, endTime]);

    const handleKhaltiPayment = useCallback(async () => {
        if (!bikeId || !startTime || !endTime) {
            setError('Missing booking details.');
            return;
        }

        setKhaltiLoading(true);
        setError(null);

        try {
            // First create a pending booking
            const token = localStorage.getItem('token');
            const bookingResponse = await fetch('http://localhost:5000/api/booking/pending', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `${token}`,
                },
                body: JSON.stringify({ bikeId, startTime, endTime }),
            });

            if (!bookingResponse.ok) {
                const bookingError = await bookingResponse.json();
                throw new Error(bookingError.error || 'Failed to create booking');
            }

            const bookingData = await bookingResponse.json();
            const bookingId = bookingData._id;

            // Now initiate Khalti payment
            const khaltiData = await initiateKhaltiPayment(bookingId);

            if (khaltiData.success && khaltiData.payment_url) {
                // Redirect to Khalti payment page
                window.location.href = khaltiData.payment_url;
            } else {
                throw new Error('Failed to get Khalti payment URL');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initiate Khalti payment');
            setKhaltiLoading(false);
        }
    }, [bikeId, startTime, endTime]);

    return (
        <div className="container-fluid p-0">
            <Menubar />
            <main className="container mt-5 p-4 bg-light rounded shadow" style={{ maxWidth: 600 }}>
                <h1 className="text-center mb-4">Payment</h1>

                {amount && (
                    <div className="text-center mb-4">
                        <h5>Total Amount: <strong>Rs. {amount}</strong></h5>
                    </div>
                )}

                {loading && (
                    <div className="text-center">
                        <div className="spinner-border text-dark" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading payment details...</p>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}

                {!loading && !error && (
                    <div className="text-center">
                        <div className="alert alert-info mb-3">
                            You will be redirected to Khalti to complete your payment.
                        </div>
                        <button
                            className="btn btn-primary w-100 py-3 fw-bold fs-5 rounded-3 shadow-sm"
                            onClick={handleKhaltiPayment}
                            disabled={khaltiLoading}
                        >
                            {khaltiLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Redirecting to Khalti...
                                </>
                            ) : (
                                'Pay with Khalti'
                            )}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PaymentPage;
