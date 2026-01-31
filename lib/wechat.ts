import WxPay from 'wechatpay-node-v3';
import fs from 'fs';
import path from 'path';

const privateKeyPath = process.env.WX_PRIVATE_KEY_PATH!;
const privateKey = fs.existsSync(privateKeyPath) 
  ? fs.readFileSync(privateKeyPath)
  : process.env.WX_PRIVATE_KEY; // 也可以直接从环境变量读取内容

export const wxPay = new WxPay({
  appid: process.env.WX_APPID!,
  mchid: process.env.WX_MCHID!,
  publicKey: process.env.WX_PUBLIC_KEY!, // 微信支付平台证书内容或路径
  privateKey: privateKey!,
  key: process.env.WX_API_V3_KEY!, // API V3 密钥
  // serial_no: process.env.WX_SERIAL_NO, // 证书序列号
});
