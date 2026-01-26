import { NextRequest, NextResponse } from 'next/server';
import { stripe, RECHARGE_PLANS } from '@/lib/stripe';
import { getServerSession } from 'next-auth';

// 改为从 lib 导入
import { authOptions } from "@/lib/auth-options";
// 而不是从 route.ts 导入
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getServerSession(authOptions);
    if (!sessionUser?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (sessionUser.user as any).id;
    const { planId } = await request.json();
    const plan = RECHARGE_PLANS.find(p => p.id === planId);
    
    if (!plan) {
      return NextResponse.json({ error: '无效的充值方案' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const checkoutSession = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: 'payment',
        // 'wechat_pay' and 'alipay' support QR codes
        // Note: wechat_pay requirement depends on your Stripe account setup (currency, etc.)
        payment_method_types: ['card', 'alipay', 'wechat_pay'], 
        line_items: [
        {
          price_data: {
            currency: 'cny',
            product_data: {
              name: `积分充值 - ${plan.credits}积分`,
              description: plan.label,
            },
            unit_amount: plan.amount * 100, // Stripe expects amounts in cents/subunit
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(),
        planId: plan.id,
        credits: plan.credits.toString(),
      },
      return_url: `${baseUrl}/recharge/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: checkoutSession.client_secret });
  } catch (error) {
    console.error('Embedded checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建支付失败' },
      { status: 500 }
    );
  }
}
