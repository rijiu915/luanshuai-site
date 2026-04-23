// middleware.ts - 路由保护
import { NextRequest, NextResponse } from 'next/server';

// 需要用户登录的路由
const userProtectedRoutes = [
  '/profile', '/recharge', '/vip', '/plus',
  '/assistant', '/editor',
  '/api/user', '/api/generate', '/api/generate-effect',
  '/api/generate-analysis', '/api/checkout', '/api/upload-temp',
];

// 管理员路由（排除 /admin/login）
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 管理员路由保护
  if (adminRoutes.some(r => pathname.startsWith(r)) && pathname !== '/admin/login') {
    const adminCookie = request.cookies.get('admin_session');
    if (!adminCookie?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.nextUrl.origin));
    }
    // 放行管理员路由（API 层面会再验证）
    return NextResponse.next();
  }

  // 用户路由保护：通过 NextAuth token cookie 判断
  const isUserRoute = userProtectedRoutes.some(r => pathname.startsWith(r));
  const isApiRoute = pathname.startsWith('/api/');
  const hasAuthToken = request.cookies.get('authjs.session-token') ||
                        request.cookies.get('__Secure-authjs.session-token') ||
                        request.cookies.get('next-auth.session-token') ||
                        request.cookies.get('__Secure-next-auth.session-token');

  if (isUserRoute && !hasAuthToken) {
    if (isApiRoute) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 用户保护路由
    '/profile/:path*',
    '/recharge/:path*',
    '/vip/:path*',
    '/plus/:path*',
    '/assistant/:path*',
    '/editor/:path*',
    '/api/user/:path*',
    '/api/generate/:path*',
    '/api/generate-effect/:path*',
    '/api/generate-analysis/:path*',
    '/api/checkout/:path*',
    '/api/upload-temp/:path*',
    // 管理员路由
    '/admin/:path*',
  ],
};
