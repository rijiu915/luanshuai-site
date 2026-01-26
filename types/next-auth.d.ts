// types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

// 扩展 User 类型
declare module "next-auth" {
  interface User {
    id: string;
    balance?: number;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      balance?: number;
    };
  }
}

// 如果你使用 JWT 策略（session.strategy = 'jwt'），也需要扩展 token
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    balance?: number;
  }
}