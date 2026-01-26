// app/api/user/points-history/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id, 10) },
      select: {
        pointsHistory: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            type: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // ✅ 关键修复：给 h 添加类型注解
    const history = user.pointsHistory.map((h: { id: number; amount: number; type: string; description: string; createdAt: Date }) => ({
      id: h.id,
      amount: h.amount,
      type: h.type,
      description: h.description,
      createdAt: h.createdAt.toISOString(),
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('获取积分记录失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}