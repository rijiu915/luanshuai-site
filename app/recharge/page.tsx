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
  const [showWxQr, setShowWxQr] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');

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
    if (showWxQr && currentOrderId) {
      timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/task/order-status?orderId=${currentOrderId}`);
          const data = await res.json();
          if (data.status === 'completed') {
            setShowWxQr(false);
            router.push(`/recharge/success?orderId=${currentOrderId}`);
          }
        } catch (err) {
          console.error('Check order status failed:', err);
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [showWxQr, currentOrderId, router]);

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

      if (paymentMethod === 'alipay' && data.url) {
        // 支付宝：直接跳转或提交表单
        // 如果返回的是 HTML 表单，我们需要将其渲染并提交
        if (data.url.includes('<form')) {
          const div = document.createElement('div');
          div.innerHTML = data.url;
          document.body.appendChild(div);
          const form = div.querySelector('form');
          if (form) form.submit();
        } else {
          window.location.href = data.url;
        }
      } else if (paymentMethod === 'wechat' && data.qrCode) {
        // 微信：显示二维码弹窗
        setQrCodeUrl(data.qrCode);
        setCurrentOrderId(data.orderId);
        setShowWxQr(true);
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
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.336 14.156h-1.503l-.408-1.554H10.94l-.382 1.554H9.088l1.91-6.845h1.597l1.741 6.845zm-1.89-2.731l-.816-3.111-1.02 3.111h1.836zM12.5 9h-2v1h2V9z" />
                </svg>
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
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.178 12.336c-.443.431-1.066.664-1.742.664-1.077 0-1.879-.582-1.879-1.289 0-.462.333-.86.86-1.11.266-.124.577-.188.905-.188.463 0 .86.131 1.155.367.142.113.313.173.491.173h.364c.237 0 .43.193.43.43s-.193.43-.43.43h-.154c-.237 0-.43.193-.43.43v.093zM8.822 14.336c-.443.431-1.066.664-1.742.664-1.077 0-1.879-.582-1.879-1.289 0-.462.333-.86.86-1.11.266-.124.577-.188.905-.188.463 0 .86.131 1.155.367.142.113.313.173.491.173h.364c.237 0 .43.193.43.43s-.193.43-.43.43h-.154c-.237 0-.43.193-.43.43v.093z" />
                </svg>
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

      {/* 微信支付二维码弹窗 */}
      {showWxQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">微信扫码支付</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">请使用微信扫描下方二维码完成支付</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-6">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-sm text-blue-500 animate-pulse">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  等待支付中...
                </div>
                <button
                  onClick={() => setShowWxQr(false)}
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
