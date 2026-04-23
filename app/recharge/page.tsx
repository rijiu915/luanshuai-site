'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { QRCodeSVG } from 'qrcode.react';

const RECHARGE_PLANS = [
  { id: 'plan_10', amount: 10, credits: 280, label: '10元 = 280积分', bonus: '' },
  { id: 'plan_35', amount: 35, credits: 1000, label: '35元 = 1000积分', bonus: '赠20积分' },
  { id: 'plan_50', amount: 50, credits: 1450, label: '50元 = 1450积分', bonus: '赠50积分' },
  { id: 'plan_100', amount: 100, credits: 3000, label: '100元 = 3000积分', bonus: '赠200积分' },
];

function RechargeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [qrPaymentMethod, setQrPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/balance')
        .then(res => res.json())
        .then(data => {
          if (data.balance !== undefined) {
            setBalance(data.balance);
          }
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
            router.push(`/recharge/success?orderId=${currentOrderId}`);
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
      setError('请选择充值方案');
      return;
    }

    if (status !== 'authenticated') {
      setError('请先登录后再充值');
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
        throw new Error(data.error || '支付失败');
      }

      if (paymentMethod === 'alipay' && data.qrCode) {
        // 支付宝：显示二维码弹窗
        setQrCodeUrl(data.qrCode);
        setCurrentOrderId(data.orderId);
        setQrPaymentMethod('alipay');
        setShowQrModal(true);
        setLoading(false);
      } else if (paymentMethod === 'wechat' && data.qrCode) {
        // 微信：显示二维码弹窗
        setQrCodeUrl(data.qrCode);
        setCurrentOrderId(data.orderId);
        setQrPaymentMethod('wechat');
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              积分充值
            </h1>
            <p className="text-gray-500 dark:text-gray-400">选择合适的充值方案，获取更多积分</p>
          </div>

          {status !== 'authenticated' && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-600 dark:text-yellow-400 text-center">
              请先 <Link href="/login" className="underline hover:opacity-80">登录</Link> 后再进行充值
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-8">
            {RECHARGE_PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-500/5 shadow-lg'
                    : 'border-border bg-card-bg hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      ¥{plan.amount}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      获得 <span className="text-blue-500 font-semibold">{plan.credits}</span> 积分
                    </div>
                  </div>
                  <div className="text-right">
                    {plan.bonus && (
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full text-xs font-medium">
                        {plan.bonus}
                      </span>
                    )}
                    <div className={`mt-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedPlan === plan.id && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </button>
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

          <button
            onClick={handleCheckout}
            disabled={!selectedPlan || loading || status !== 'authenticated'}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              !selectedPlan || loading || status !== 'authenticated'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                处理中...
              </span>
            ) : (
              '立即充值'
            )}
          </button>

          <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>官方渠道结算，安全有保障</p>
            <p className="mt-1">充值成功后积分将自动到账</p>
          </div>
        </div>
      </main>

      {/* 支付二维码弹窗 */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">{qrPaymentMethod === 'alipay' ? '支付宝扫码支付' : '微信扫码支付'}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                请使用{qrPaymentMethod === 'alipay' ? '支付宝' : '微信'}扫描下方二维码完成支付
              </p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-6">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>

              <div className="flex flex-col gap-3">
                <div className={`flex items-center justify-center gap-2 text-sm animate-pulse ${
                  qrPaymentMethod === 'alipay' ? 'text-blue-500' : 'text-green-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${qrPaymentMethod === 'alipay' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
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

export default function RechargePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <RechargeContent />
    </Suspense>
  );
}
