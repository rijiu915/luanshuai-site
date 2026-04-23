import { NextRequest, NextResponse } from 'next/server';
import { stripe, RECHARGE_PLANS, VIP_PLANS } from '@/lib/stripe';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const { planId } = await request.json();
    
    const rechargePlan = RECHARGE_PLANS.find(p => p.id === planId);
    const vipPlan = VIP_PLANS.find(p => p.id === planId);
    
    if (!rechargePlan && !vipPlan) {
      return NextResponse.json({ error: '无效的方案' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (rechargePlan) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cny',
              product_data: {
                name: `积分充值 - ${rechargePlan.credits}积分`,
                description: rechargePlan.label,
              },
              unit_amount: rechargePlan.amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId.toString(),
          planId: rechargePlan.id,
          credits: rechargePlan.credits.toString(),
          type: 'recharge',
        },
        success_url: `${baseUrl}/recharge/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/recharge?canceled=true`,
      });

      return NextResponse.json({ url: session.url });
    }

    if (vipPlan) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cny',
              product_data: {
                name: vipPlan.label,
                description: `${vipPlan.level} 会员 - 30天`,
              },
              unit_amount: vipPlan.amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId.toString(),
          planId: vipPlan.id,
          vipLevel: vipPlan.level,
          type: 'vip',
        },
        success_url: `${baseUrl}/profile?success=vip&level=${vipPlan.level}`,
        cancel_url: `${baseUrl}/vip?canceled=true`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: '无效的方案' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '创建支付失败' },
      { status: 500 }
    );
  }
}
