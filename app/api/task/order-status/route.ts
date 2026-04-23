import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { queryOrderByOutTradeNo } from '@/lib/wechat';
import { alipaySdk } from '@/lib/alipay';
import { processSuccessfulOrder } from '@/lib/payment-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
      select: { status: true, provider: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 如果已经完成，直接返回
    if (transaction.status === 'completed') {
      return NextResponse.json({ status: 'completed' });
    }

    // 如果是 pending 状态，主动向支付渠道查询
    if (transaction.status === 'pending') {
      try {
        let paid = false;

        if (transaction.provider === 'wechat' && orderId.startsWith('WX_')) {
          // 主动查询微信支付订单状态
          const wxResult = await queryOrderByOutTradeNo(orderId);
          paid = wxResult.tradeState === 'SUCCESS';
        } else if (transaction.provider === 'alipay' && orderId.startsWith('ALI_')) {
          // 主动查询支付宝订单状态
          const aliResult = await alipaySdk.exec('alipay.trade.query', {
            bizContent: { outTradeNo: orderId },
          });
          paid = aliResult.code === '10000' && aliResult.tradeStatus === 'TRADE_SUCCESS';
        }

        // 如果支付成功，处理订单
        if (paid) {
          await processSuccessfulOrder(orderId);
          return NextResponse.json({ status: 'completed' });
        }
      } catch (queryError) {
        // 查询失败不影响轮询，继续返回 pending
        console.error('Query payment status failed:', queryError);
      }
    }

    return NextResponse.json({ status: transaction.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
