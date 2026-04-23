import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { alipaySdk } from '@/lib/alipay';
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

    // 环境变量校验
    if (!process.env.ALIPAY_APP_ID || process.env.ALIPAY_APP_ID === 'your_alipay_app_id') {
      console.error('支付宝配置缺失：ALIPAY_APP_ID 未设置');
      return NextResponse.json({ error: '支付宝支付暂未配置，请使用其他支付方式' }, { status: 503 });
    }

    const outTradeNo = `ALI_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 1. 创建订单记录 (状态为 pending)
    await prisma.transaction.create({
      data: {
        orderId: outTradeNo,
        userId: parseInt(userId),
        amount: Math.round(plan.amount * 100), // 以分为单位存储
        credits: plan.credits || null,
        planId: planId,
        provider: 'alipay',
        status: 'pending',
      },
    });

    // 2. 调用支付宝订单码支付（alipay.trade.precreate）生成二维码
    const result = await alipaySdk.exec('alipay.trade.precreate', {
      notifyUrl: `${siteUrl}/api/webhook/alipay`,
      bizContent: {
        outTradeNo,
        totalAmount: plan.amount.toFixed(2), // 支付宝以元为单位
        subject: plan.type ? `购买 ${plan.type} 会员 - lstwin` : `充值 ${plan.credits} 积分 - lstwin`,
        body: plan.type ? `${plan.type}月会员` : `积分充值 ${plan.credits}`,
        // 超时关闭时间：30分钟
        timeoutExpress: '30m',
      },
    });

    if (result.code !== '10000') {
      console.error('支付宝预创建失败:', result.subCode, result.subMsg);
      return NextResponse.json(
        { error: result.subMsg || '创建支付二维码失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qrCode: result.qrCode, // 二维码链接，前端用 qrcode.react 渲染
      orderId: outTradeNo,
    });
  } catch (error: any) {
    console.error('Alipay precreate error:', error);
    return NextResponse.json(
      { error: error.message || '创建支付订单失败' },
      { status: 500 }
    );
  }
}
