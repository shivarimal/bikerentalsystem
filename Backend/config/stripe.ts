import Stripe from 'stripe';
import dotenv from 'dotenv';


dotenv.config();

export const STRIPE_API_VERSION = '2026-04-22.dahlia' as const;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}