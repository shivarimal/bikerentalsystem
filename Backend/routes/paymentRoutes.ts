import express from 'express';
import { handleWebhook } from '../controllers/webhookController';
import authenticateToken from '../middlewares/auth';
import { createPaymentIntent } from '../controllers/paymentController';
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil', // or whatever Stripe dashboard shows
  
});
// Create a payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res, next) => {
  try {
    await createPaymentIntent(req, res);
  } catch (error) {
    next(error);
  }
});
// Handle successful payment and create booking
router.post('/payment-success', authenticateToken, async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const { paymentIntentId, pickupLocation } = req.body;
    const userId = req.body.user?.id;

    if (!paymentIntentId) {
      res.status(400).json({ message: 'Missing paymentIntentId' });
      return;
    }
    // Verify payment status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Extract booking details from metadata
      const { bikeId, startTime, endTime } = paymentIntent.metadata;
;

      // Import models
      const Bike = require('../models/bike').default;
      const Booking = require('../models/booking').default;

      // Find the bike
      const bike = await Bike.findById(bikeId);
      if (!bike) {
        res.status(404).json({ error: 'Bike not found' });
        return;
      }

      // Update bike availability
      bike.isAvailable = false;
      await bike.save();
      // Create a new booking
      const newBooking = new Booking({
        userId,
        bikeId,
        bike,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'booked',
        paymentId: paymentIntentId,
        paymentAmount: paymentIntent.amount / 100, // Convert back from cents
        paymentStatus: 'completed',
        pickupLocation: pickupLocation || null
      });

      const savedBooking = await newBooking.save();

      res.status(200).json({
        message: 'Payment confirmed and booking created',
        booking: savedBooking
      });
    } else {
      res.status(400).json({ message: 'Payment not successful yet' });
      return;
    }
     } catch (error: any) {
    console.error('Error in /payment-success:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
// Webhook for Stripe events (no authentication required as it's called by Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    await handleWebhook(req, res);
    return;
  } catch (error) {
    next(error);
  }
});

export default router;