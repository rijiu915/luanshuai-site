"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = async () => {
    if (session?.user) {
      try {
        const res = await fetch("/api/user/balance");
        const data = await res.json();
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    }
  };

  useEffect(() => {
    fetchBalance();
    
    // Refresh balance on focus
    const handleFocus = () => fetchBalance();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setShowDropdown(false);
    window.location.href = "/";
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
          <span className="text-xl font-bold">
            孪数<span className="text-orange-400">AI</span>
          </span>
        </Link>

        {/* 右侧功能区 */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
            <Link href="/recharge" passHref>
              <button className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm md:text-base rounded-lg hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap">
                充值积分
              </button>
            </Link>

            <Link href="/vip" passHref>
              <button className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm md:text-base rounded-lg hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                会员特权
              </button>
            </Link>
          
          <Link href="/assistant" passHref>
            <button className="hidden md:block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm">
              草图助手
            </button>
          </Link>

          {status === "loading" ? (
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
          ) : session?.user ? (
            <div
              className="relative"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <Link href="/profile">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                  <span className="text-white font-semibold text-sm">
                    {session.user.name?.charAt(0).toUpperCase() ||
                      session.user.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </span>
                </div>
              </Link>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">当前账户</p>
                    <p className="text-foreground font-medium truncate">{session.user.email}</p>
                  </div>
                  <div className="p-4 border-b border-border">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">可用积分</p>
                    <p className="text-foreground font-bold text-lg">
                      {balance !== null ? balance.toLocaleString() : "..."}
                    </p>
                  </div>
                  <div className="p-2">
                    <Link href="/profile" className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                      个人中心
                    </Link>
                    <Link href="/assistant" className="md:hidden block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                      草图助手
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" passHref>
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                登录
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
