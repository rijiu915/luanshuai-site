// app/api/forgot-password/route.ts - 发送密码重置链接
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // 速率限制
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${limit.retryAfter} 秒后再试` },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 无论用户是否存在，都返回成功，防止邮箱枚举
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 分钟有效期

      await prisma.user.update({
        where: { email },
        data: {
          resetToken: token,
          resetExpiry: expiry,
        },
      });

      // 在实际生产中，这里应该发送邮件
      // const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;
      // await sendEmail(email, '密码重置', `点击链接重置密码: ${resetUrl}`);

      console.log(`[密码重置] token=${token}, email=${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    );
  }
}
