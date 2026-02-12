import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Always allow login page and auth API (no auth required)
  if (pathname === '/login' || pathname === '/api/auth/verify') {
    return NextResponse.next();
  }

  // Protect admin routes and admin API
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';

    if (!isAuthenticated) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/auth/verify',
  ],
}; 