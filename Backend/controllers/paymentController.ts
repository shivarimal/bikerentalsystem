import { Request, Response } from 'express';
import Stripe from 'stripe';
import Booking from '../models/booking';
import Bike from '../models/bike';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

// Create a payment intent for a booking
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { bikeId, startTime, endTime } = req.body;
    const userId = req.body.user.id;

    // Validate the bike exists
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    // Validate the bike is available
    if (!bike.isAvailable) {
      return res.status(400).json({ error: 'Bike is not available' });
    }

    // Calculate the rental duration and amount
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (startDate < currentDate || endDate < currentDate) {
      return res.status(400).json({ error: 'Dates cannot be in the past' });
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Calculate the total hours between start and end time
    const diffInHours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    const amount = diffInHours * bike.pricePerHour;

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe requires amount in cents
      currency: 'inr', // Change to your currency
      metadata: {
        bikeId: bikeId,
        userId: userId,
        startTime: startTime,
        endTime: endTime,
      },
    });

    // Return the client secret to the frontend
    console.log('64')
     return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Handle successful payment and create booking
export const handlePaymentSuccess = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.body.user.id;

    // Retrieve the payment intent to get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Verify payment status
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Extract booking details from metadata
    const { bikeId, startTime, endTime } = paymentIntent.metadata;

    // Find the bike
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found' });
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
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({ error: 'Failed to process payment and create booking' });
  }
};

// Note: Webhook handling has been moved to webhookController.ts