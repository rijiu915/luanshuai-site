// lib/admin-auth.ts - 管理员认证（验证逻辑，与用户登录系统完全隔离）
import bcrypt from 'bcryptjs';

const ADMIN_ACCOUNT = {
  username: '18217272223',
  passwordHash: '$2b$10$taEQQJnzzjbwBFWmXhTQ2uF6RLcJbQ8Lf6qrR7/InVpVUjD11Zikm',
};

const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24; // 24 小时

/**
 * 管理员登录验证
 */
export async function adminLogin(username: string, password: string): Promise<boolean> {
  if (username !== ADMIN_ACCOUNT.username) return false;
  const isValid = await bcrypt.compare(password, ADMIN_ACCOUNT.passwordHash);
  return isValid;
}

/**
 * 验证管理员 session token 格式
 */
export function isValidAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split('.');
    if (parts.length !== 2) return false;
    const timestamp = parseInt(parts[0], 36);
    if (isNaN(timestamp)) return false;
    // 检查是否在 24 小时内
    return Date.now() - timestamp < ADMIN_SESSION_MAX_AGE * 1000;
  } catch {
    return false;
  }
}

/**
 * 检查管理员是否已登录（用于 API 路由中）
 */
export async function getAdminSession(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return false;
  return isValidAdminToken(token);
}
