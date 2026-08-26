import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static asset and internal Next paths bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    return NextResponse.next();
  }

  // 2. Read admin authentication cookie
  const token = request.cookies.get('admin_token')?.value;

  // 3. Login page handling
  if (pathname === '/login') {
    if (token) {
      // Already authenticated, redirect to admin home
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 4. Public error pages
  if (
    pathname === '/404' ||
    pathname === '/500' ||
    pathname === '/not-found' ||
    pathname.startsWith('/_not-found')
  ) {
    return NextResponse.next();
  }

  // 5. Protected Dashboard Routes: redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

