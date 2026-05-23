import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các route công khai không cần đăng nhập
const publicRoutes = ['/login', '/register', '/forgot-password'];

// Các route cần đăng nhập
const protectedRoutes = ['/myprofile', '/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect từ trang chủ "/" sang "/tournaments" (server-side, nhanh hơn)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/tournaments', request.url));
  }

  // Kiểm tra token từ cookies (middleware không thể đọc localStorage)
  const token = request.cookies.get('token')?.value;

  // Nếu đang ở trang public và đã đăng nhập -> redirect về tournaments
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/tournaments', request.url));
  }

  // Nếu đang ở trang protected và chưa đăng nhập -> redirect về login
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - images và các static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
