import { NextRequest, NextResponse } from 'next/server';
import { wxPay } from '@/lib/wechat';
import { processSuccessfulOrder } from '@/lib/payment-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers);

    // 1. 验证签名并解密数据
    // 注意：wechatpay-node-v3 的具体用法可能因版本而异，以下为常见用法
    const result = await wxPay.verifySign(body, headers['wechatpay-signature'] as string, headers);
    
    if (!result) {
      console.error('WeChat webhook signature verification failed');
      return NextResponse.json({ code: 'FAIL', message: '签名失败' }, { status: 400 });
    }

    // 2. 解密资源内容
    const resource = wxPay.decipher_gcm(
      body.resource.ciphertext,
      body.resource.associated_data,
      body.resource.nonce,
      process.env.WX_API_V3_KEY!
    );

    // 3. 检查交易状态
    if (resource.trade_state === 'SUCCESS') {
      const orderId = resource.out_trade_no;
      await processSuccessfulOrder(orderId);
    }

    return NextResponse.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('WeChat webhook error:', error);
    return NextResponse.json({ code: 'FAIL', message: '服务器错误' }, { status: 500 });
  }
}
