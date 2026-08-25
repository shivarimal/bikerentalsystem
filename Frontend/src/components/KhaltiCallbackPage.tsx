import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Menubar from './Menubar';
import Footer from './Footer';

const KhaltiCallbackPage: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');

  useEffect(() => {
    document.title = 'Payment Callback - Bike Rental';

    const paymentStatus = searchParams.get('payment');

    if (paymentStatus === 'success') {
      setStatus('success');
    } else if (paymentStatus === 'failed' || paymentStatus === 'error' || paymentStatus === 'amount_mismatch') {
      setStatus('failed');
    } else {
      setStatus('processing');
    }

    // Redirect to profile after showing status
    const timer = setTimeout(() => {
      navigate('/Profile');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Menubar />
      <main className="container flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="card border-0 shadow-lg p-5 rounded-4 text-center" style={{ maxWidth: 500 }}>
          {status === 'processing' && (
            <>
              <div className="spinner-border text-primary mx-auto mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h4 className="fw-bold mb-2">Verifying Payment Status...</h4>
              <p className="text-muted mb-0">Please wait while we confirm your payment transaction.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-3 text-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l5-5.25a.75.75 0 0 0-.02-1.067z"/>
                </svg>
              </div>
              <h4 className="fw-bold mb-2 text-success">Payment Successful!</h4>
              <p className="text-muted mb-0">Your payment has been confirmed. Redirecting to your profile...</p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mb-3 text-danger">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                </svg>
              </div>
              <h4 className="fw-bold mb-2 text-danger">Payment Failed</h4>
              <p className="text-muted mb-0">Your payment could not be processed. Redirecting to your profile...</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default KhaltiCallbackPage;
