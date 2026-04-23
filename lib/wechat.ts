import crypto from 'crypto';

// 微信支付 V3 配置类型
interface WxPayConfig {
  appid: string;
  mchid: string;
  publicKey: string;
  privateKey: string;
  key: string; // APIv3 密钥
}

let wxPayInstance: any = null;

/**
 * 获取微信支付 SDK 实例（懒加载）
 */
async function getWxPayInstance() {
  if (wxPayInstance) return wxPayInstance;

  const WxPay = (await import('wechatpay-node-v3')).default;
  const fs = await import('fs');

  const privateKeyPath = process.env.WX_PRIVATE_KEY_PATH;
  let privateKey: string | Buffer = '';

  if (privateKeyPath && fs.existsSync(privateKeyPath)) {
    privateKey = fs.readFileSync(privateKeyPath);
  } else if (process.env.WX_PRIVATE_KEY) {
    privateKey = process.env.WX_PRIVATE_KEY;
  }

  if (!process.env.WX_APPID || !process.env.WX_MCHID || !process.env.WX_API_V3_KEY) {
    throw new Error('微信支付环境变量未配置：需要 WX_APPID, WX_MCHID, WX_API_V3_KEY');
  }

  wxPayInstance = new WxPay({
    appid: process.env.WX_APPID,
    mchid: process.env.WX_MCHID,
    publicKey: process.env.WX_PUBLIC_KEY || '',
    privateKey: privateKey,
    key: process.env.WX_API_V3_KEY,
  });

  return wxPayInstance;
}

/**
 * 创建 Native 支付订单（生成二维码链接）
 */
export async function createNativeOrder(params: {
  description: string;
  outTradeNo: string;
  notifyUrl: string;
  total: number; // 单位：分
}) {
  const wxPay = await getWxPayInstance();

  const result = await wxPay.transactions_native({
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: {
      total: params.total,
      currency: 'CNY',
    },
  });

  if (result.code_url) {
    return { qrCode: result.code_url, orderId: params.outTradeNo };
  }

  throw new Error('获取微信支付二维码链接失败: ' + JSON.stringify(result));
}

/**
 * 主动查询订单状态（通过商户单号）
 * 用于前端轮询时直接向微信查询，不依赖 webhook
 */
export async function queryOrderByOutTradeNo(outTradeNo: string): Promise<{
  tradeState: string;
  tradeStateDesc?: string;
  successTime?: string;
}> {
  const wxPay = await getWxPayInstance();

  const result = await wxPay.query({
    out_trade_no: outTradeNo,
    mchid: process.env.WX_MCHID!,
  });

  return {
    tradeState: result.trade_state,
    tradeStateDesc: result.trade_state_desc,
    successTime: result.success_time,
  };
}

/**
 * 解密回调通知资源
 */
export async function decryptCallback(body: any): Promise<any> {
  const wxPay = await getWxPayInstance();

  return wxPay.decipher_gcm(
    body.resource.ciphertext,
    body.resource.associated_data,
    body.resource.nonce,
    process.env.WX_API_V3_KEY!
  );
}

/**
 * 验证回调签名
 */
export async function verifySign(body: any, signature: string, headers: Record<string, any>): Promise<boolean> {
  const wxPay = await getWxPayInstance();

  try {
    const result = wxPay.verifySign(body, signature, headers);
    return !!result;
  } catch (error) {
    console.error('微信支付签名验证异常:', error);
    return false;
  }
}
