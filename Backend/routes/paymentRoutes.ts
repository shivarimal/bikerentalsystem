import express from 'express';
import authMiddleware from '../middlewares/auth';
import { createPaymentIntent, handlePaymentSuccess } from '../controllers/paymentController';
import { initiateKhaltiPayment, handleKhaltiCallback, verifyKhaltiPayment } from '../controllers/khaltiController';

const router = express.Router();

// Stripe routes
router.post('/create-intent', authMiddleware, createPaymentIntent);
router.post('/success', authMiddleware, handlePaymentSuccess);

// Khalti routes
router.post('/khalti/initiate', authMiddleware, initiateKhaltiPayment);
router.get('/khalti/callback', handleKhaltiCallback);
router.post('/khalti/verify', authMiddleware, verifyKhaltiPayment);

export default router;
