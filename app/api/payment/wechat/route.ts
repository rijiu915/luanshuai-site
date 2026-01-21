import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const RECHARGE_PLANS = [
  { id: 'plan_10', amount: 10, credits: 280 },
  { id: 'plan_35', amount: 35, credits: 1000 },
  { id: 'plan_50', amount: 50, credits: 1450 },
  { id: 'plan_100', amount: 100, credits: 3000 },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { planId } = await request.json();
    const plan = RECHARGE_PLANS.find(p => p.id === planId);

    if (!plan) {
      return NextResponse.json({ error: '无效的充值方案' }, { status: 400 });
    }

    const outTradeNo = `WX_${crypto.randomBytes(8).toString('hex')}`;

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          orderId: outTradeNo,
          userId: parseInt(userId),
          amount: plan.amount * 100,
          credits: plan.credits,
          provider: 'wechat',
          status: 'completed',
          completedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          balance: {
            increment: plan.credits,
          },
        },
      }),
    ]);

    return NextResponse.json({ 
      success: true,
      orderId: outTradeNo,
      credits: plan.credits,
    });
  } catch (error: any) {
    console.error('WeChat Pay checkout error:', error);
    return NextResponse.json(
      { error: error.message || '创建支付失败' },
      { status: 500 }
    );
  }
}
