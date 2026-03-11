import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const isLoginPage = nextUrl.pathname === '/login';
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth');
  const isStatic = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname === '/favicon.ico';

  // Always allow static and auth API routes
  if (isStatic || isApiAuth) return NextResponse.next();

  // Get JWT token from cookie (Edge-safe — no DB calls)
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;

  // Redirect unauthenticated to login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Redirect logged-in away from login
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Cashier: restrict to POS + inventory
  if (token?.role === 'cashier') {
    const allowed = ['/', '/pos', '/inventory'];
    const ok = allowed.some(p => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + '/'));
    if (!ok) return NextResponse.redirect(new URL('/pos', nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
