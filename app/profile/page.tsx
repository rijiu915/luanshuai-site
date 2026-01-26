'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';

interface PointsRecord {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
    const [balance, setBalance] = useState<number | null>(null);
    const [vipLevel, setVipLevel] = useState<string>('FREE');
    const [vipExpiry, setVipExpiry] = useState<string | null>(null);
    const [history, setHistory] = useState<PointsRecord[]>([]);
    const [loading, setLoading] = useState(true);
  
    const fetchData = async () => {
      if (!session?.user) return;
      try {
        const timestamp = new Date().getTime();
        const [balanceRes, historyRes] = await Promise.all([
          fetch(`/api/user/balance?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/user/points-history?t=${timestamp}`, { cache: 'no-store' }),
        ]);
        
        const balanceData = await balanceRes.json();
        const historyData = await historyRes.json();
  
        if (balanceData.balance !== undefined) {
          setBalance(balanceData.balance);
          setVipLevel(balanceData.vipLevel || 'FREE');
          setVipExpiry(balanceData.vipExpiry);
        }
      if (historyData.history) {
        setHistory(historyData.history);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
      
      // 当窗口重新获得焦点时刷新数据
      window.addEventListener('focus', fetchData);
      return () => window.removeEventListener('focus', fetchData);
    }
  }, [session]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recharge': return '充值';
      case 'consume': return '消费';
      case 'refund': return '退款';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recharge': return 'text-green-600 dark:text-green-400';
      case 'consume': return 'text-red-600 dark:text-red-400';
      case 'refund': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card-bg rounded-xl p-6 mb-8 border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{session.user.name || '用户'}</h1>
              <p className="text-gray-500 dark:text-gray-400">{session.user.email}</p>
            </div>
          </div>
          
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-input-bg rounded-lg p-4 border border-border">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">积分余额</p>
                <p className="text-3xl font-bold text-orange-400">
                  {balance !== null ? balance.toLocaleString() : '0'}
                </p>
              </div>
                <div className="flex-1 bg-input-bg rounded-lg p-4 border border-border relative overflow-hidden group">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">会员等级</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-3xl font-bold ${vipLevel === 'SVIP' ? 'text-purple-500' : vipLevel === 'VIP' ? 'text-blue-500' : 'text-gray-500'}`}>
                      {vipLevel === 'FREE' ? '普通用户' : vipLevel}
                    </p>
                    {vipLevel !== 'FREE' && (
                      <span className="px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-bold rounded uppercase">
                        Pro
                      </span>
                    )}
                  </div>
                  {vipExpiry && (
                    <p className="text-xs text-gray-400 mt-2">
                      有效期至: {new Date(vipExpiry).toLocaleDateString()}
                    </p>
                  )}
                  <Link href="/vip" className="absolute top-4 right-4 text-xs text-blue-500 hover:underline">
                    {vipLevel === 'FREE' ? '立即开通' : '续费会员'}
                  </Link>
                </div>
            </div>
        </div>

        <div className="bg-card-bg rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-4">积分使用记录</h2>
          
          {history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">暂无记录</p>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div 
                  key={record.id} 
                  className="flex items-center justify-between p-4 bg-input-bg rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="font-medium">{record.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${getTypeColor(record.type)}`}>
                      {record.amount > 0 ? '+' : ''}{record.amount}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getTypeLabel(record.type)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;