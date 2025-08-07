import express from 'express';
// import { createPaymentIntent, handlePaymentSuccess } from '../controllers/paymentController';
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
 console.log('create-payment-intent');
 try {
    await createPaymentIntent(req, res);
  } catch (error) {
    next(error);
  }
});

// Handle successful payment and create booking
router.post('/payment-success', authenticateToken, async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {


      
      const { paymentIntentId, bookingId } = req.body;
      
      if (!paymentIntentId || !bookingId) {
          res.status(400).json({ message: 'Missing paymentIntentId or bookingId' });
          return;
        }
         console.log('35');
        // Optional: verify payment status from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log('payment-success');
        
        if (paymentIntent.status === 'succeeded') {
            // Update booking/payment in your database
            // For example:
            // await Booking.update({ status: 'paid' }, { where: { id: bookingId } });

      res.status(200).json({ message: 'Payment confirmed and booking updated' });
    } else {
      res.status(400).json({ message: 'Payment not successful yet' });
      return;
    }

  } catch (error) {
    console.error('Error in /payment-success:', error);
    next(error);
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