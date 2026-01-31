import { NextRequest, NextResponse } from 'next/server';
import { alipaySdk } from '@/lib/alipay';
import { processSuccessfulOrder } from '@/lib/payment-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: any = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });

    // 1. 验证签名
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.error('Alipay webhook signature verification failed');
      return new NextResponse('fail', { status: 400 });
    }

    // 2. 检查交易状态
    if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
      const orderId = params.out_trade_no;
      await processSuccessfulOrder(orderId);
    }

    return new NextResponse('success');
  } catch (error) {
    console.error('Alipay webhook error:', error);
    return new NextResponse('fail', { status: 500 });
  }
}
