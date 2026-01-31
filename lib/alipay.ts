import AlipaySdk from 'alipay-sdk';

export const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!,
  privateKey: process.env.ALIPAY_PRIVATE_KEY!,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
  // 如果是证书模式，还需要配置以下证书路径
  // appCertPath: process.env.ALIPAY_APP_CERT_PATH,
  // alipayPublicCertPath: process.env.ALIPAY_PUBLIC_CERT_PATH,
  // alipayRootCertPath: process.env.ALIPAY_ROOT_CERT_PATH,
});
