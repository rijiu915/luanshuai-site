// lib/rate-limit.ts - 简易内存速率限制
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number // 秒
}

/**
 * 检查请求频率限制
 * @param key 标识（如 IP 地址或邮箱）
 * @param maxAttempts 时间窗口内最大次数
 * @param windowMs 时间窗口（毫秒）
 */
export function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 默认 15 分钟
): RateLimitResult {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }

  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  record.count++
  return { allowed: true }
}

/**
 * 重置某 key 的速率限制（如登录成功后）
 */
export function resetRateLimit(key: string) {
  rateLimitMap.delete(key)
}

// 定期清理过期记录（每 10 分钟）
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 10 * 60 * 1000)
