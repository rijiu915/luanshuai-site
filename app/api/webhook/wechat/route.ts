import { NextRequest, NextResponse } from 'next/server';
import { processSuccessfulOrder } from '@/lib/payment-service';
import { verifySign, decryptCallback } from '@/lib/wechat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('wechatpay-signature') || '';
    const headers = Object.fromEntries(request.headers);

    // 1. 验证签名
    const valid = await verifySign(body, signature, headers);
    if (!valid) {
      console.error('WeChat webhook signature verification failed');
      return NextResponse.json({ code: 'FAIL', message: '签名失败' }, { status: 400 });
    }

    // 2. 解密通知内容
    const resource = await decryptCallback(body);

    // 3. 检查交易状态
    if (resource.trade_state === 'SUCCESS') {
      const orderId = resource.out_trade_no;
      await processSuccessfulOrder(orderId);
    }

    // 4. 验签成功返回 200（无响应体）
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('WeChat webhook error:', error);
    return NextResponse.json({ code: 'FAIL', message: '服务器错误' }, { status: 500 });
  }
}
