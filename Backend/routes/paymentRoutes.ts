import express from 'express';
import authMiddleware from '../middlewares/auth';
import { initiateKhaltiPayment, handleKhaltiCallback, verifyKhaltiPayment } from '../controllers/khaltiController';

const router = express.Router();

// Khalti routes
router.post('/khalti/initiate', authMiddleware, initiateKhaltiPayment);
router.get('/khalti/callback', handleKhaltiCallback);
router.post('/khalti/verify', authMiddleware, verifyKhaltiPayment);

export default router;
