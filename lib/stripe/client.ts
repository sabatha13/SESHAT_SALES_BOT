import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
  apiVersion: '2024-06-20',
  typescript: true,
});
