import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple check for x-admin-token in a real app, this would be a session/cookie check
  // or a redirect to a separate login page.
  // For now, we simulate protection.
  const adminSecret = request.headers.get('x-admin-token') || request.cookies.get('admin-session');
  
  // In a real production scenario, you would verify this against your backend
  // or use a JWT.
  if (!adminSecret && !request.nextUrl.pathname.startsWith('/login')) {
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


