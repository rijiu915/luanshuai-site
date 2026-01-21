// lib/auth.ts
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session_user_id';

// 设置登录态（存用户 ID 到 Cookie）
export async function setLoginSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: '/',
  });
}

// 获取当前登录用户 ID
export async function getLoginSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return userId ? parseInt(userId, 10) : null;
}

// 清除登录态
export async function clearLoginSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// 验证密码
import bcrypt from 'bcryptjs';
export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}