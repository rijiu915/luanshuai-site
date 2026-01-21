// app/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 简单验证
    if (!email || !password) {
      setError('请填写邮箱和密码');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6位');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || '注册失败，请重试');
      }
    } catch (err) {
      console.error('注册请求失败:', err);
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">注册成功！</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">正在跳转到登录页...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card-bg rounded-xl shadow-md p-8 space-y-6 border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">创建账户</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">加入我们，开始使用 AI 助手</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              姓名（可选）
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg text-foreground"
              placeholder="张三"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg text-foreground"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              密码
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg text-foreground"
              placeholder="至少6位"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">建议使用字母+数字组合</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition`}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          已有账户？{' '}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}