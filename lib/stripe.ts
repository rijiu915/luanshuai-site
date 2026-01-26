import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {

  typescript: true,
});

export const RECHARGE_PLANS = [
  { id: 'plan_10', amount: 1000, credits: 100, label: '10元 = 100积分' },
  { id: 'plan_50', amount: 5000, credits: 550, label: '50元 = 550积分' },
  { id: 'plan_100', amount: 10000, credits: 1200, label: '100元 = 1200积分' },
] as const;

export type RechargePlan = typeof RECHARGE_PLANS[number];
