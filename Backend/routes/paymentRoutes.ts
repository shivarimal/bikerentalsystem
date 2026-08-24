import express from 'express';
import authMiddleware from '../middlewares/auth';
import { createPaymentIntent, handlePaymentSuccess } from '../controllers/paymentController';

const router = express.Router();

router.post('/create-intent', authMiddleware, createPaymentIntent);
router.post('/success', authMiddleware, handlePaymentSuccess);

export default router;
