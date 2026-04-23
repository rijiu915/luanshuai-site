"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

const THEMES = [
  { value: "light", icon: Sun, label: "亮色" },
  { value: "dark", icon: Moon, label: "暗色" },
  { value: "system", icon: Monitor, label: "跟随系统" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
    );
  }

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[2];
  const CurrentIcon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card-bg hover:bg-muted transition-all duration-200 hover:border-blue-500/30 hover:shadow-sm"
        title={`当前：${current.label}`}
      >
        <CurrentIcon className="w-4 h-4 text-foreground transition-all duration-300" />
      </button>

      {/* 下拉菜单 */}
      {showMenu && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-36 py-1.5 rounded-xl border border-border bg-card-bg shadow-xl shadow-black/10 dark:shadow-black/40 z-[200] animate-in fade-in slide-in-from-top-2 duration-150">
          {THEMES.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setShowMenu(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg mx-0.5 transition-all duration-150 ${
                theme === value
                  ? "text-blue-600 dark:text-blue-400 bg-blue-500/8 font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
              style={{ width: "calc(100% - 4px)" }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{label}</span>
              {theme === value && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
