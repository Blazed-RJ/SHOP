import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isLoginPage = nextUrl.pathname === '/login';
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth');

  // Always allow auth API routes
  if (isApiAuth) return NextResponse.next();

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Redirect logged-in users away from login page
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Role-based: cashiers cannot access admin-only areas
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === 'cashier') {
    // Cashiers can only access POS
    const allowedPaths = ['/', '/pos', '/inventory'];
    const allowed = allowedPaths.some(p => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + '/'));
    if (!allowed) {
      return NextResponse.redirect(new URL('/pos', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
