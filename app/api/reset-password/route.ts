// app/api/reset-password/route.ts - 通过 token 重置密码
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 密码强度验证
    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少需要8位' }, { status: 400 });
    }
    if (!/[a-zA-Z]/.test(password)) {
      return NextResponse.json({ error: '密码必须包含至少一个字母' }, { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: '密码必须包含至少一个数字' }, { status: 400 });
    }

    // 查找 token 对应的用户
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '重置链接无效或已过期' },
        { status: 400 }
      );
    }

    // 更新密码并清除 token
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    );
  }
}
