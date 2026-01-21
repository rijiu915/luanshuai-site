// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    console.log('收到注册请求'); // 👈 加上这行日志
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    // 测试数据库连接
    const testUser = await prisma.user.findMany();
    console.log('测试查询结果:', testUser); // 👈 看是否能查到数据

    // 继续你的逻辑...
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('注册API错误:', error); // 👈 输出详细错误
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    );
  }
}