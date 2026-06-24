import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các route công khai không cần đăng nhập
const publicRoutes = ['/login', '/register', '/forgot-password', '/info', '/terms-conditions', '/privacy-policy', '/cookie-policy', '/news', '/tournaments', '/player', '/players'];


// Các trang auth — khi đã đăng nhập thì redirect ra ngoài
const authRoutes = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bỏ qua kiểm tra các file tĩnh, ảnh, favicon và api
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Kiểm tra token từ cookies (middleware không thể đọc localStorage)
  const token = request.cookies.get('token')?.value;

  // Nếu chưa đăng nhập và không ở trang công khai -> redirect về login
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (!token && !isPublicRoute) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect từ trang chủ "/" sang "/tournaments"
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/tournaments', request.url));
  }

  // Nếu đã đăng nhập mà vào trang auth (login/register/...) -> redirect về tournaments
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/tournaments', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except API routes, _next/static, _next/image, and favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

