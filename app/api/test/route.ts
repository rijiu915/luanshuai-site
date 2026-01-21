// app/api/test/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json({ error: '数据库错误' }, { status: 500 });
  }
}