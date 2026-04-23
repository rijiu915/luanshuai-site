import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { balance: true, vipLevel: true, vipExpiry: true },
      });

      return NextResponse.json({ 
        balance: user?.balance ?? 0,
        vipLevel: user?.vipLevel ?? 'FREE',
        vipExpiry: user?.vipExpiry
      });
}
