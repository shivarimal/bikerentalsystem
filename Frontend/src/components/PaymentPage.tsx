import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Menubar from './Menubar';
import { createPaymentIntent, handlePaymentSuccess } from '../scripts/API Calls/paymentApiCalls';

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
                        <p className="mt-2">Initializing payment...</p>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}

                {clientSecret && paymentIntentId && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm paymentIntentId={paymentIntentId} />
                    </Elements>
                )}
            </main>
        </div>
    );
};

export default PaymentPage;
