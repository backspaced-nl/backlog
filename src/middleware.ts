import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for an admin route or admin API
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')) {
    // Allow access to login page and auth API endpoint
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/api/auth/verify') {
      return NextResponse.next();
    }

    const isAuthenticated = request.cookies.get('admin_auth')?.value === 'true';

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // For API routes, return 401 Unauthorized
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      // For page routes, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/auth/verify'
  ],
}; 