'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(!!sessionId);
  const [credits, setCredits] = useState<string | null>(searchParams.get('credits'));

  useEffect(() => {
    if (sessionId) {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 border border-border rounded-3xl p-8 shadow-lg text-center">
          {loading ? (
            <div className="py-8">
              <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">正在确认支付...</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                充值成功
              </h1>
              
              <p className="text-gray-500 dark:text-gray-400 mb-8">您的积分已到账</p>
              
              {credits && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-8 space-y-4 border border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">获得积分</span>
                    <span className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">+{credits}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                >
                  开始创作
                </Link>
                <Link
                  href="/recharge"
                  className="block w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-all border border-border text-foreground"
                >
                  继续充值
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
