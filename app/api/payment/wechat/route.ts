import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { createNativeOrder } from '@/lib/wechat';
import crypto from 'crypto';

const RECHARGE_PLANS = [
  { id: 'plan_10', amount: 10, credits: 280 },
  { id: 'plan_35', amount: 35, credits: 1000 },
  { id: 'plan_50', amount: 50, credits: 1450 },
  { id: 'plan_100', amount: 100, credits: 3000 },
  { id: 'vip_monthly', amount: 29.9, type: 'VIP', duration: 30 },
  { id: 'svip_monthly', amount: 59.9, type: 'SVIP', duration: 30 },
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { planId } = await request.json();
    const plan = RECHARGE_PLANS.find(p => p.id === planId);

    if (!plan) {
      return NextResponse.json({ error: '无效的方案' }, { status: 400 });
    }

    const outTradeNo = `WX_${crypto.randomBytes(8).toString('hex')}`;

    // 1. 创建订单记录 (状态为 pending)
    await prisma.transaction.create({
      data: {
        orderId: outTradeNo,
        userId: parseInt(userId),
        amount: Math.round(plan.amount * 100),
        credits: plan.credits || null,
        planId: planId,
        provider: 'wechat',
        status: 'pending',
      },
    });

    // 2. 调用微信支付 Native 下单（生成二维码链接）
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const result = await createNativeOrder({
      description: plan.type ? `购买 ${plan.type} 会员` : `充值 ${plan.credits} 积分`,
      outTradeNo: outTradeNo,
      notifyUrl: `${siteUrl}/api/webhook/wechat`,
      total: Math.round(plan.amount * 100),
    });

    return NextResponse.json({
      success: true,
      qrCode: result.qrCode,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error('WeChat Pay checkout error:', error);
    return NextResponse.json(
      { error: error.message || '操作失败' },
      { status: 500 }
    );
  }
}
