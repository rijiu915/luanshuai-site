"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./theme-toggle";
import { Coins, Crown, Zap, User, LogOut, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [vipLevel, setVipLevel] = useState<string>("FREE");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchBalance = async () => {
    if (session?.user) {
      try {
        const res = await fetch("/api/user/balance");
        const data = await res.json();
        if (data.balance !== undefined) {
          setBalance(data.balance);
          setVipLevel(data.vipLevel || "FREE");
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    }
  };

  useEffect(() => {
    fetchBalance();
    const handleFocus = () => fetchBalance();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setShowDropdown(false);
    window.location.href = "/";
  };

  const vipBadgeStyle =
    vipLevel === "SVIP"
      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
      : vipLevel === "VIP"
      ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
      : "";

  return (
    <header className="border-b border-border glass sticky top-0 z-50">
      <div className="container mx-auto px-4 py-0 flex justify-between items-center h-14">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-105">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" opacity="0.6" />
              <path d="M2 12l10 5 10-5" opacity="0.4" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tracking-tight">孪数</span>
            <span className="text-lg font-bold text-blue-500 tracking-tight">AI</span>
          </div>
        </Link>

        {/* 右侧 */}
        <div className="flex items-center gap-2">

          {/* 余额展示（已登录时常驻显示） */}
          {session?.user && balance !== null && (
            <Link href="/recharge" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card-bg hover:border-orange-400/50 hover:bg-orange-500/5 transition-all duration-200 group">
              <Coins className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-foreground">{balance.toLocaleString()}</span>
              {vipLevel !== "FREE" && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${vipBadgeStyle}`}>
                  {vipLevel}
                </span>
              )}
            </Link>
          )}

          <ThemeToggle />

          {/* 充值按钮 */}
          <Link href="/recharge">
            <button className="btn-magnetic hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm rounded-lg shadow-sm font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>充值</span>
            </button>
          </Link>

          {/* 会员按钮 */}
          <Link href="/vip">
            <button className="btn-magnetic hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm rounded-lg shadow-sm font-medium">
              <Crown className="w-3.5 h-3.5" />
              <span>会员</span>
            </button>
          </Link>

          {/* 草图助手 */}
          <Link href="/assistant">
            <button className="btn-magnetic hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg shadow-sm font-medium">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>草图助手</span>
            </button>
          </Link>

          {/* 用户区域 */}
          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
          ) : session?.user ? (
            <div
              className="relative"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <Link href="/profile">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer ring-2 ring-transparent hover:ring-blue-400/50 transition-all duration-200 shadow-sm">
                  <span className="text-white font-bold text-sm">
                    {session.user.name?.charAt(0).toUpperCase() ||
                      session.user.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </span>
                </div>
              </Link>

              {/* 下拉 */}
              {showDropdown && (
                <div className="absolute right-0 top-full pt-2 w-60 z-50">
                  <div className="bg-card-bg border border-border rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* 用户信息头部 */}
                    <div className="p-4 border-b border-border bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-bold">
                            {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {session.user.name || "用户"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 余额 */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-orange-400" />
                          <span className="text-xs text-muted-foreground">可用积分</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-foreground">
                            {balance !== null ? balance.toLocaleString() : "—"}
                          </span>
                          {vipLevel !== "FREE" && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${vipBadgeStyle}`}>
                              {vipLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 菜单项 */}
                    <div className="p-2">
                      <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                        <User className="w-4 h-4 text-muted-foreground" />
                        个人中心
                      </Link>
                      <Link href="/assistant" className="md:hidden flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                        草图助手
                      </Link>
                      <Link href="/vip" className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        会员特权
                      </Link>
                      <Link href="/recharge" className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                        <Zap className="w-4 h-4 text-orange-400" />
                        积分充值
                      </Link>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <button className="btn-magnetic px-4 py-1.5 border border-border bg-card-bg text-foreground text-sm rounded-lg hover:border-blue-400/50 transition-all">
                登录
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
