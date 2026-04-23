// auth.ts - NextAuth v5 配置
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { rateLimit, resetRateLimit } from "@/lib/rate-limit"

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('请输入邮箱和密码');
        }

        // 速率限制：同一邮箱 15 分钟内最多 5 次尝试
        const limit = rateLimit(`login:${credentials.email}`, 5, 15 * 60 * 1000);
        if (!limit.allowed) {
          throw new Error(`登录尝试过多，请${limit.retryAfter}秒后再试`);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error('用户不存在');
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error('密码错误');
        }

        // 登录成功，重置速率限制
        resetRateLimit(`login:${credentials.email}`);

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          balance: user.balance,
          vipLevel: user.vipLevel,
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.balance = user.balance;
        token.vipLevel = user.vipLevel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.balance = token.balance as number;
        session.user.vipLevel = token.vipLevel as string;
      }
      return session;
    },
  },
})
