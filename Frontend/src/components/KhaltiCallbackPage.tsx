import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menubar from './Menubar';
import Footer from './Footer';

const KhaltiCallbackPage: React.FC = (): JSX.Element => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Payment Callback - Bike Rental';
    const timer = setTimeout(() => {
      navigate('/Profile');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Menubar />
      <main className="container flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="card border-0 shadow-lg p-5 rounded-4 text-center">
          <div className="spinner-border text-primary mx-auto mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="fw-bold mb-2">Verifying Payment Status...</h4>
          <p className="text-muted mb-0">Please wait while we confirm your payment transaction.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default KhaltiCallbackPage;
