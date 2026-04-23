import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  try {
    // 可选：验证用户身份（防止查询他人订单）
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: '请先登录' }, { status: 401 });
    // }

    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
      select: {
        orderId: true,
        amount: true,
        credits: true,
        planId: true,
        provider: true,
        status: true,
        completedAt: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // amount 存储的是分，转换为元返回
    return NextResponse.json({
      ...transaction,
      amountYuan: transaction.amount / 100,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
