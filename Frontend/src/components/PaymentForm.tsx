import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../scripts/API Calls/bookingApiCalls';
import './PaymentForm.css';

interface PaymentFormProps {
  bikeId?: string;
  startTime?: string;
  endTime?: string;
  amount?: number;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  bikeId = '',
  startTime = '',
  endTime = '',
  amount = 0,
}) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'khalti' | 'cash'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bikeId) {
      setErrorMsg('No bike selected for booking.');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber || !cardHolder || !expiry || !cvv) {
        setErrorMsg('Please fill in all card details.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const start = startTime ? new Date(startTime) : new Date();
      const end = endTime ? new Date(endTime) : new Date(Date.now() + 3600000);

      await createBooking(bikeId, start, end, () => {
        setPaymentSuccess(true);
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="card text-center p-4 border-0 shadow-lg rounded-4 bg-white">
        <div className="card-body">
          <div className="mb-3 text-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l5-5.25a.75.75 0 0 0-.02-1.067z"/>
            </svg>
          </div>
          <h3 className="card-title fw-bold text-dark mb-2">Payment Confirmed!</h3>
          <p className="card-text text-muted mb-4">
            Your bike booking is successfully confirmed. Get ready for your ride!
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-primary px-4 py-2 fw-semibold rounded-3" onClick={() => navigate('/Profile')}>
              View My Bookings
            </button>
            <button className="btn btn-outline-secondary px-4 py-2 fw-semibold rounded-3" onClick={() => navigate('/Home')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container my-4">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
        <div className="card-header bg-dark text-white p-4 d-flex align-items-center justify-content-between">
          <div>
            <h4 className="mb-1 fw-bold">Complete Your Rental Payment</h4>
            <p className="mb-0 text-light opacity-75 small">Secure Payment Gateway</p>
          </div>
          <div className="fs-3">💳</div>
        </div>

        <div className="card-body p-4">
          {errorMsg && (
            <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4" role="alert">
              <strong>Error:</strong> {errorMsg}
              <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
            </div>
          )}

          <div className="payment-details mb-4 rounded-3 p-3 bg-light border">
            <h6 className="fw-bold text-uppercase text-secondary small mb-3">Booking Summary</h6>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Start Date / Time:</span>
              <span className="fw-semibold text-dark">{startTime ? new Date(startTime).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Return Date / Time:</span>
              <span className="fw-semibold text-dark">{endTime ? new Date(endTime).toLocaleString() : 'N/A'}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark fs-5">Total Amount:</span>
              <span className="fw-bold text-success fs-4">${amount}</span>
            </div>
          </div>

          <form onSubmit={handlePay} className="payment-form">
            <div className="mb-4">
              <label className="form-label text-dark fw-bold mb-2">Select Payment Method</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  💳 Credit / Debit Card
                </button>
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  💵 Cash on Pickup
                </button>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="card-element-container p-3 mb-4 rounded-3 border bg-white">
                <div className="mb-3">
                  <label className="form-label small text-uppercase text-muted fw-bold">Cardholder Name</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="John Doe"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-uppercase text-muted fw-bold">Card Number</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="4532 0000 0000 0000"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    required
                  />
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label small text-uppercase text-muted fw-bold">Expiry Date</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-uppercase text-muted fw-bold">CVV</label>
                    <input
                      type="password"
                      className="form-control rounded-3"
                      placeholder="123"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="alert alert-info rounded-3 mb-4">
                <strong>Pay at Store:</strong> You can pay total amount <strong>${amount}</strong> directly when picking up your bike.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-dark w-100 py-3 fw-bold fs-5 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Processing Payment...
                </>
              ) : (
                <>
                  Confirm & Pay ${amount}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
