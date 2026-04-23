import { AlipaySdk } from 'alipay-sdk';

const isDev = process.env.NODE_ENV === 'development';

export const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!,
  privateKey: process.env.ALIPAY_PRIVATE_KEY!,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
  // 签名算法，推荐 RSA2（SHA256WithRSA）
  signType: 'RSA2',
  // 网关地址：生产环境用正式网关，开发环境可切换沙箱
  gateway: isDev && process.env.ALIPAY_USE_SANDBOX === 'true'
    ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
    : 'https://openapi.alipay.com/gateway.do',
  // 字符集
  charset: 'utf-8',
  // 超时时间（毫秒）
  timeout: 30000,
  // 如果需要使用证书模式，取消注释以下配置并填入证书路径
  // certPath: process.env.ALIPAY_CERT_PATH,
  // alipayPublicCertPath: process.env.ALIPAY_PUBLIC_CERT_PATH,
  // alipayRootCertPath: process.env.ALIPAY_ROOT_CERT_PATH,
});
