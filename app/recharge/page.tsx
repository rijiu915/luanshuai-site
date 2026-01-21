'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Navbar } from '@/components/navbar';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (canceled) {
      setError('支付已取消');
    }
  }, [canceled]);

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
        throw new Error(data.error || '创建支付失败');
      }

      router.push(`/recharge/success?credits=${data.credits}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '支付失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setShowDropdown(false);
    window.location.reload();
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

              <div className="mb-6 p-4 bg-card-bg border border-border rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">选择支付方式</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('alipay')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      paymentMethod === 'alipay'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border bg-input-bg hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.422 15.358c-3.066-1.302-5.328-2.392-6.936-3.336a19.032 19.032 0 001.354-4.25H18V6.27h-5.25V4.5h-1.5v1.77H6v1.5h9.144a16.523 16.523 0 01-1.14 3.476c-1.476-.726-3.21-1.356-5.016-1.356-2.592 0-4.488 1.602-4.488 3.768 0 2.046 1.53 3.684 4.626 3.684 2.46 0 4.476-1.086 5.94-2.742 1.692.936 4.044 2.058 7.422 3.33l.234-2.572zM9.096 15.84c-2.364 0-3.102-1.17-3.102-2.184 0-.954.69-2.208 2.844-2.208 1.524 0 3.024.528 4.398 1.2-1.128 1.788-2.676 3.192-4.14 3.192z"/>
                </svg>
                <span className="font-medium">支付宝</span>
              </button>
              <button
                onClick={() => setPaymentMethod('wechat')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === 'wechat'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border hover:border-green-300 dark:hover:border-green-700'
                }`}
              >
                <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.139.045c.133 0 .241-.108.241-.245 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.036 2.123c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
                </svg>
                <span className="font-medium">微信支付</span>
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
            <p>支付由支付宝/微信支付提供保障</p>
            <p className="mt-1">充值成功后积分将立即到账</p>
            <p className="mt-2 text-xs text-yellow-500/70 dark:text-yellow-400/50">(当前为模拟模式，点击即充值成功)</p>
          </div>
        </div>
      </main>
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
