// app/api/admin/auth-check/route.ts - 检查管理员登录状态
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

export async function GET() {
  const isAdmin = await getAdminSession();
  return NextResponse.json({ authenticated: isAdmin });
}
