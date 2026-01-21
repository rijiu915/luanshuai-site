import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      pointsHistory: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  return NextResponse.json({
    history: user.pointsHistory.map((h) => ({
      id: h.id,
      amount: h.amount,
      type: h.type,
      description: h.description,
      createdAt: h.createdAt.toISOString(),
    })),
  });
}
