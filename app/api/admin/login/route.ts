// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminLogin } from '@/lib/admin-auth';
import { rateLimit } from '@/lib/rate-limit';

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'lstwin-admin-secret-2024';
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24; // 24 小时

// 简单的 session token 生成
function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return Buffer.from(`${timestamp}.${random}`).toString('base64url');
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = rateLimit(`admin:login:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `尝试次数过多，请 ${limit.retryAfter} 秒后再试` },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 });
    }

    const isValid = await adminLogin(username, password);
    if (!isValid) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    // 生成 token 并通过 NextResponse 设置 cookie
    const token = generateSessionToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ADMIN_SESSION_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
