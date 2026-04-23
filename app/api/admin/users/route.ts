// app/api/admin/users/route.ts - 用户管理 API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-auth';

// 管理员认证中间件
async function checkAdmin(): Promise<NextResponse | null> {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  return null;
}

// GET - 获取用户列表（支持分页、搜索）
export async function GET(req: NextRequest) {
  const authError = await checkAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          balance: true,
          vipLevel: true,
          vipExpiry: true,
          createdAt: true,
          _count: {
            select: {
              pointsHistory: true,
              generationTasks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}

// PATCH - 更新用户信息（余额、VIP等级）
export async function PATCH(req: NextRequest) {
  const authError = await checkAdmin();
  if (authError) return authError;

  try {
    const { userId, balance, vipLevel, vipExpiry } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (balance !== undefined) updateData.balance = balance;
    if (vipLevel !== undefined) {
      updateData.vipLevel = vipLevel;
      // 如果取消 VIP，清空过期时间
      if (vipLevel === 'FREE') {
        updateData.vipExpiry = null;
      }
    }
    if (vipExpiry !== undefined) updateData.vipExpiry = new Date(vipExpiry);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        vipLevel: true,
        vipExpiry: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 });
  }
}
