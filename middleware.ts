import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the auth cookie
  const authCookie = request.cookies.get('kitabi_admin_auth');
  
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  if (!authCookie && !isLoginPage) {
    // If no cookie and trying to access a protected route, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authCookie && isLoginPage) {
    // If logged in and trying to access login page, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$).*)',
  ],
};
