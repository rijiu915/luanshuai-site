'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { QRCodeSVG } from 'qrcode.react';

const VIP_PLANS = [
  { 
    id: 'vip_monthly', 
    amount: 29.9, 
    level: 'VIP', 
    label: 'VIP 会员', 
    features: ['每次生图少 3 积分', '专属 VIP 标识', '极速生成通道'],
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    id: 'svip_monthly', 
    amount: 59.9, 
    level: 'SVIP', 
    label: 'SVIP 尊贵会员', 
    features: ['每次生图少 5 积分', '专属 SVIP 标识', '优先体验新功能', '更高清的分辨率选项'],
    color: 'from-purple-600 to-pink-600'
  },
];

function VIPContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [currentOrderId, setCurrentOrderId] = useState('');

    useEffect(() => {
      if (session?.user) {
        fetch('/api/user/balance')
          .then(res => res.json())
          .then(data => {
            setUserInfo(data);
          })
          .catch(console.error);
      }
    }, [session]);

  // 轮询订单状态
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showQrModal && currentOrderId) {
      timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/task/order-status?orderId=${currentOrderId}`);
          const data = await res.json();
          if (data.status === 'completed') {
            setShowQrModal(false);
            router.push(`/profile`);
          }
        } catch (err) {
          console.error('Check order status failed:', err);
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [showQrModal, currentOrderId, router]);

    const handleCheckout = async () => {
      if (!selectedPlan) {
        setError('请选择会员方案');
        return;
      }

      if (status !== 'authenticated') {
        setError('请先登录后再开通');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint = paymentMethod === 'alipay' ? '/api/payment/alipay' : '/api/payment/wechat';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: selectedPlan }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '开通失败');
        }

        if (paymentMethod === 'alipay' && data.qrCode) {
          // 支付宝：显示二维码弹窗
          setQrCodeUrl(data.qrCode);
          setCurrentOrderId(data.orderId);
          setShowQrModal(true);
          setLoading(false);
        } else if (paymentMethod === 'wechat' && data.qrCode) {
          // 微信：显示二维码弹窗
          setQrCodeUrl(data.qrCode);
          setCurrentOrderId(data.orderId);
          setShowQrModal(true);
          setLoading(false);
        } else {
          throw new Error('支付请求异常');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '支付失败，请重试');
        setLoading(false);
      }
    };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              会员中心
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">开启高级特权，享受更低成本的创作体验</p>
          </div>

          {userInfo?.vipLevel && userInfo.vipLevel !== 'FREE' && (
            <div className="mb-10 p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl text-center">
              <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                您当前已是 {userInfo.vipLevel} 会员
              </p>
              {userInfo.vipExpiry && (
                <p className="text-sm text-gray-500 mt-1">
                  有效期至: {new Date(userInfo.vipExpiry).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {VIP_PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`cursor-pointer group relative p-8 rounded-3xl border-2 transition-all duration-500 flex flex-col h-full ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-500/5 shadow-2xl scale-[1.02]'
                    : 'border-border bg-card-bg hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className={`absolute top-0 right-0 p-4 transform transition-transform group-hover:scale-110 ${
                  selectedPlan === plan.id ? 'text-blue-500' : 'text-gray-300'
                }`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === plan.id ? 'border-blue-500 bg-blue-500' : 'border-current'
                  }`}>
                    {selectedPlan === plan.id && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className={`mb-6 p-3 rounded-2xl w-fit bg-gradient-to-br ${plan.color}`}>
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.label}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">¥{plan.amount}</span>
                  <span className="text-gray-500 text-sm">/ 30天</span>
                </div>

                <ul className="space-y-4 flex-grow mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-green-500/10 text-green-500`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">选择支付方式</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('alipay')}
                  className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all duration-300 ${
                    paymentMethod === 'alipay'
                      ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                      : 'border-border bg-card-bg hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-bold" style={{ backgroundColor: '#1677FF' }}>支</span>
                  支付宝
                </button>
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all duration-300 ${
                    paymentMethod === 'wechat'
                      ? 'border-green-500 bg-green-500/5 text-green-600 dark:text-green-400'
                      : 'border-border bg-card-bg hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-bold" style={{ backgroundColor: '#07C160' }}>微</span>
                  微信支付
                </button>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <button
                onClick={handleCheckout}
                disabled={!selectedPlan || loading || status !== 'authenticated'}
                className={`w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 ${
                  !selectedPlan || loading || status !== 'authenticated'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    支付中...
                  </span>
                ) : (
                  '立即开启特权'
                )}
              </button>
            </div>

            <div className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
              <p className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                官方渠道结算，安全有保障
              </p>
              <p>开通会员即代表您同意我们的 <Link href="/about" className="underline">会员服务协议</Link></p>
            </div>
        </div>
      </main>

      {/* 支付二维码弹窗 */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">
                {paymentMethod === 'alipay' ? '支付宝扫码支付' : '微信扫码支付'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                请使用{paymentMethod === 'alipay' ? '支付宝' : '微信'}扫描下方二维码完成支付
              </p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-6">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>

              <div className="flex flex-col gap-3">
                <div className={`flex items-center justify-center gap-2 text-sm animate-pulse ${
                  paymentMethod === 'alipay' ? 'text-blue-500' : 'text-green-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${paymentMethod === 'alipay' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                  等待支付中...
                </div>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  取消支付
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VIPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <VIPContent />
    </Suspense>
  );
}
