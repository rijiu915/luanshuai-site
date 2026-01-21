import { NextRequest, NextResponse } from 'next/server';
import { stripe, RECHARGE_PLANS } from '@/lib/stripe';
import { getLoginSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await getLoginSession();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { planId } = await request.json();
    const plan = RECHARGE_PLANS.find(p => p.id === planId);
    
    if (!plan) {
      return NextResponse.json({ error: '无效的充值方案' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cny',
            product_data: {
              name: `积分充值 - ${plan.credits}积分`,
              description: plan.label,
            },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(),
        planId: plan.id,
        credits: plan.credits.toString(),
      },
      success_url: `${baseUrl}/recharge/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/recharge?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || '创建支付失败' },
      { status: 500 }
    );
  }
}
