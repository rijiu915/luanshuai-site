// lib/auth.ts - 密码工具函数
import bcrypt from 'bcryptjs';

/**
 * 验证明文密码是否匹配哈希密码
 */
export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
