// types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

// 扩展 User 类型
declare module "next-auth" {
  interface User {
    id: string;
    balance?: number;
    vipLevel?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      balance?: number;
      vipLevel?: string;
    };
  }
}

// JWT 策略扩展
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    balance?: number;
    vipLevel?: string;
  }
}
