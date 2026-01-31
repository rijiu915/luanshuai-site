import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth-options";
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { planId } = await request.json();
    const plan = RECHARGE_PLANS.find(p => p.id === planId);

    if (!plan) {
      return NextResponse.json({ error: '无效的方案' }, { status: 400 });
    }

    const outTradeNo = `ALI_${crypto.randomBytes(8).toString('hex')}`;

    // 1. 创建订单记录 (状态为 pending)
    await prisma.transaction.create({
      data: {
        orderId: outTradeNo,
        userId: parseInt(userId),
        amount: Math.round(plan.amount * 100),
        credits: plan.credits || null,
        planId: planId,
        provider: 'alipay',
        status: 'pending',
      },
    });

    // 2. 调用支付宝 SDK 生成支付表单/链接
    const formData = new (require('alipay-sdk').default.FormData)();
    formData.addField('notifyUrl', `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/alipay`);
    formData.addField('returnUrl', `${process.env.NEXT_PUBLIC_SITE_URL}/recharge/success?orderId=${outTradeNo}`);
    formData.addField('bizContent', {
      outTradeNo,
      productCode: 'FAST_INSTANT_TRADE_PAY',
      totalAmount: plan.amount.toFixed(2),
      subject: plan.type ? `购买 ${plan.type} 会员` : `充值 ${plan.credits} 积分`,
    });

    // exec 返回的是一个 form 字符串，前端可以直接提交，或者生成一个链接
    const result = await alipaySdk.pageExec('alipay.trade.page.pay', { formData });

    return NextResponse.json({ 
      success: true, 
      url: result 
    });
  } catch (error: any) {
    console.error('Alipay checkout error:', error);
    return NextResponse.json(
      { error: error.message || '操作失败' },
      { status: 500 }
    );
  }
}
