import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {

  typescript: true,
});

export const RECHARGE_PLANS = [
  { id: 'plan_10', amount: 1000, credits: 280, label: '10元 = 280积分', bonus: '' },
  { id: 'plan_35', amount: 3500, credits: 1000, label: '35元 = 1000积分', bonus: '赠20积分' },
  { id: 'plan_50', amount: 5000, credits: 1450, label: '50元 = 1450积分', bonus: '赠50积分' },
  { id: 'plan_100', amount: 10000, credits: 3000, label: '100元 = 3000积分', bonus: '赠200积分' },
] as const;

export const VIP_PLANS = [
  { 
    id: 'vip_monthly', 
    amount: 2990, 
    level: 'VIP', 
    label: 'VIP 会员', 
    features: ['每次生图少 3 积分', '专属 VIP 标识', '极速生成通道'],
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    id: 'svip_monthly', 
    amount: 5990, 
    level: 'SVIP', 
    label: 'SVIP 尊贵会员', 
    features: ['每次生图少 5 积分', '专属 SVIP 标识', '优先体验新功能', '更高清的分辨率选项'],
    color: 'from-purple-600 to-pink-600'
  },
] as const;

export type RechargePlan = typeof RECHARGE_PLANS[number];
export type VipPlan = typeof VIP_PLANS[number];
