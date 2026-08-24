import { Request, Response } from 'express';
import Stripe from 'stripe';
import Booking from '../models/booking';
import Bike from '../models/bike';
import { getStripeClient } from '../config/stripe';

// Create a payment intent for a booking
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const stripe = getStripeClient();

    if (!stripe) {
      res.status(500).json({ error: 'Stripe secret key is not configured' });
      return;
    }

    const { bikeId, startTime, endTime } = req.body;
    const userId = (req as any).user?.id || req.body.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User is not authenticated' });
      return;
    }

    // Validate the bike exists
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      res.status(404).json({ error: 'Bike not found' });
      return;
    }

    // Validate the bike is available
    if (!bike.isAvailable) {
      res.status(400).json({ error: 'Bike is not available' });
      return;
    }

    // Calculate the rental duration and amount
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (startDate < currentDate || endDate < currentDate) {
      res.status(400).json({ error: 'Dates cannot be in the past' });
      return;
    }

    if (startDate > endDate) {
      res.status(400).json({ error: 'End time must be after start time' });
      return;
    }

    // Calculate the total hours between start and end time
    const diffInHours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
    const amount = diffInHours * bike.pricePerHour;

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe requires amount in cents
      currency: 'usd',
      metadata: {
        bikeId: bikeId,
        userId: userId,
        startTime: startTime,
        endTime: endTime,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Handle successful payment and create booking
export const handlePaymentSuccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const stripe = getStripeClient();

    if (!stripe) {
      res.status(500).json({ error: 'Stripe secret key is not configured' });
      return;
    }

    const { paymentIntentId } = req.body;
    const userId = (req as any).user?.id || req.body.user?.id;

    // Retrieve the payment intent to get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify payment status
    if (paymentIntent.status !== 'succeeded') {
      res.status(400).json({ error: 'Payment not successful' });
      return;
    }

    // Extract booking details from metadata
    const { bikeId, startTime, endTime } = paymentIntent.metadata;

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
      userId: userId || paymentIntent.metadata.userId,
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