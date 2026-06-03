import { Request, Response } from 'express';
import Stripe from 'stripe';
import Booking from '../models/booking';
import Bike from '../models/bike';
import { getStripeClient } from '../config/stripe';

type WebhookPaymentIntent = {
  id: string;
  amount: number;
  metadata: Record<string, string>;
};

// Handle Stripe webhook events
export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripeClient();

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe secret key is not configured' });
  }

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret || '');
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific events
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: WebhookPaymentIntent) {
  try {
    console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

    // Extract booking details from metadata
    const { bikeId, userId, startTime, endTime } = paymentIntent.metadata;

    // Find the bike
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      console.error('Bike not found for payment:', paymentIntent.id);
      return;
    }

    // Update bike availability
    bike.isAvailable = false;
    await bike.save();

    // Check if booking already exists (to prevent duplicates)
    const existingBooking = await Booking.findOne({ paymentId: paymentIntent.id });
    if (existingBooking) {
      console.log('Booking already exists for payment:', paymentIntent.id);
      return;
    }

    // Create a new booking
    const newBooking = new Booking({
      userId,
      bikeId,
      bike,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: 'booked',
      paymentId: paymentIntent.id,
      paymentAmount: paymentIntent.amount / 100, // Convert back from cents
      paymentStatus: 'completed',
    });

    await newBooking.save();
    console.log('Booking created successfully for payment:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment success webhook:', error);
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: WebhookPaymentIntent) {
  try {
    console.log(`Payment failed for PaymentIntent: ${paymentIntent.id}`);

    // You could create a record of failed payments if needed
    // Or send notifications to admins/users
  } catch (error) {
    console.error('Error handling payment failure webhook:', error);
  }
}