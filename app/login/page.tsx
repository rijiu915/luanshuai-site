// app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError('邮箱或密码错误');
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    }
  };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card-bg p-8 rounded-lg shadow-md w-full max-w-md border border-border">
          <h1 className="text-2xl font-bold mb-6 text-center text-foreground">登录</h1>
          {success && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 text-center">
              登录成功！正在跳转...
            </div>
          )}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-input-bg text-foreground"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-input-bg text-foreground"
                required
              />
            </div>
            <button
              type="submit"
              disabled={success}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              登录
            </button>
          </form>
          <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
            还没有账户？<a href="/register" className="text-blue-600 dark:text-blue-400">立即注册</a>
          </p>
        </div>
      </div>
    );
}