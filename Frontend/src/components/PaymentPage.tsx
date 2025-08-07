import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menubar from './Menubar';
import Footer from './Footer';
import PaymentForm from './PaymentForm';
import { Bike } from '../Types';

interface PaymentPageProps {}

const PaymentPage: React.FC<PaymentPageProps> = () => {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<{
    bikeId: string;
    startTime: Date;
    endTime: Date;
    amount: number;
  } | null>(null);

  useEffect(() => {
    // Get payment data from URL parameters
    const params = new URLSearchParams(window.location.search);
    const bikeId = params.get('bikeId');
    const startTime = params.get('startTime');
    const endTime = params.get('endTime');
    const amount = params.get('amount');
    
    if (bikeId && startTime && endTime && amount) {
      setPaymentData({
        bikeId: bikeId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        amount: parseFloat(amount)
      });
    } else {
      // Redirect to home if no payment data
      navigate('/');
    }
  }, [navigate]);

  const handlePaymentSuccess = () => {
    // Show success message and redirect to profile page
    alert('Payment successful! Your bike has been booked.');
    navigate('/profile');
  };

  const handlePaymentCancel = () => {
    // Redirect back to home page
    navigate('/');
  };

  if (!paymentData) {
    return (
      <div className="h-100 d-flex flex-column">
        <Menubar />
        <div className="container mt-5 text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-100 d-flex flex-column">
      <Menubar />
      <div className="container mt-5 mb-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <PaymentForm
              bikeId={paymentData.bikeId}
              startTime={paymentData.startTime}
              endTime={paymentData.endTime}
              amount={paymentData.amount}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentPage;