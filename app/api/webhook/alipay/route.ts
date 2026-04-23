import { NextRequest, NextResponse } from 'next/server';
import { alipaySdk } from '@/lib/alipay';
import { processSuccessfulOrder } from '@/lib/payment-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 支付宝异步通知以 form-urlencoded 格式发送
    const text = await request.text();
    const params: Record<string, string> = {};

    // 解析 URL-encoded body
    text.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
      }
    });

    console.log('Alipay webhook received, orderId:', params.out_trade_no, 'status:', params.trade_status);

    // 1. 验证签名（关键安全步骤）
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.error('Alipay webhook signature verification failed, params:', params);
      return new NextResponse('fail', { status: 400 });
    }

    // 2. 校验 app_id 防止伪造通知
    if (params.app_id !== process.env.ALIPAY_APP_ID) {
      console.error('Alipay webhook app_id mismatch:', params.app_id);
      return new NextResponse('fail', { status: 400 });
    }

    // 3. 检查交易状态
    if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
      const orderId = params.out_trade_no;

      // 4. 查询订单核对金额（防止篡改）
      const transaction = await prisma.transaction.findUnique({
        where: { orderId },
      });

      if (!transaction) {
        console.error('Order not found:', orderId);
        return new NextResponse('fail', { status: 400 });
      }

      if (transaction.status === 'completed') {
        // 已处理过，幂等返回成功
        return new NextResponse('success');
      }

      // 核对金额：数据库存的是分，支付宝传的是元
      const expectedAmount = (transaction.amount / 100).toFixed(2);
      if (params.total_amount !== expectedAmount) {
        console.error('Amount mismatch:', { expected: expectedAmount, received: params.total_amount, orderId });
        return new NextResponse('fail', { status: 400 });
      }

      // 5. 处理成功订单（加积分/开VIP）
      await processSuccessfulOrder(orderId);
      console.log('Order processed successfully:', orderId);
    }

    // 支付宝要求返回纯文本 "success"
    return new NextResponse('success');
  } catch (error) {
    console.error('Alipay webhook error:', error);
    return new NextResponse('fail', { status: 500 });
  }
}

// 支付宝可能也会发 GET 请求（验证用），直接忽略
export async function GET() {
  return new NextResponse('ok');
}
