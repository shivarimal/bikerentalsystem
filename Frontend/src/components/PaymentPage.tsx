import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Menubar from './Menubar';
import { createPaymentIntent, handlePaymentSuccess } from '../scripts/API Calls/paymentApiCalls';
import { initiateKhaltiPayment } from '../scripts/API Calls/khaltiApiCalls';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm: React.FC<{ paymentIntentId: string }> = ({ paymentIntentId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || 'Payment failed');
            setProcessing(false);
            return;
        }

        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/Home`,
            },
            redirect: 'if_required',
        });

        if (confirmError) {
            setError(confirmError.message || 'Payment failed');
            setProcessing(false);
            return;
        }

        try {
            await handlePaymentSuccess(paymentIntentId);
            navigate('/Home');
        } catch {
            setError('Payment succeeded but booking creation failed. Please contact support.');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <button
                type="submit"
                className="btn btn-dark w-100 mt-3 border-2 border-dark"
                disabled={!stripe || processing}>
                {processing ? 'Processing...' : 'Pay Now'}
            </button>
        </form>
    );
};

const PaymentPage: React.FC = (): JSX.Element => {
    const [searchParams] = useSearchParams();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'khalti'>('stripe');
    const [khaltiLoading, setKhaltiLoading] = useState(false);

    const bikeId = searchParams.get('bikeId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const amount = searchParams.get('amount');

    useEffect(() => {
        if (!bikeId || !startTime || !endTime) {
            setError('Missing booking details. Please go back and try again.');
            setLoading(false);
            return;
        }

        const initPayment = async () => {
            try {
                const data = await createPaymentIntent(bikeId, startTime, endTime);
                setClientSecret(data.clientSecret);
                setPaymentIntentId(data.clientSecret?.split('_secret_')?.[0] || null);
            } catch (err: any) {
                setError(err.message || 'Failed to initialize payment');
            } finally {
                setLoading(false);
            }
        };

        initPayment();
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

                {/* Payment Method Toggle */}
                <div className="mb-4">
                    <label className="form-label text-dark fw-bold mb-2">Select Payment Method</label>
                    <div className="btn-group w-100" role="group">
                        <button
                            type="button"
                            className={`btn ${paymentMethod === 'stripe' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setPaymentMethod('stripe')}
                        >
                            Credit / Debit Card
                        </button>
                        <button
                            type="button"
                            className={`btn ${paymentMethod === 'khalti' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setPaymentMethod('khalti')}
                        >
                            Khalti Wallet
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="text-center">
                        <div className="spinner-border text-dark" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Initializing payment...</p>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}

                {/* Stripe Payment */}
                {paymentMethod === 'stripe' && clientSecret && paymentIntentId && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm paymentIntentId={paymentIntentId} />
                    </Elements>
                )}

                {/* Khalti Payment */}
                {paymentMethod === 'khalti' && !loading && (
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
