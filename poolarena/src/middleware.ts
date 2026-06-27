import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các route công khai không cần đăng nhập đối với người dùng thông thường
const publicRoutes = ['/login', '/register', '/forgot-password', '/info', '/terms-conditions', '/privacy-policy', '/cookie-policy', '/news', '/player', '/players'];

// Các trang auth — khi đã đăng nhập thì redirect ra ngoài
const authRoutes = ['/login', '/register', '/forgot-password'];

function isSearchBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const botKeywords = [
    'googlebot',
    'google',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'baiduspider',
    'facebookexternalhit',
    'zalo-uri-validator',
    'zalobot',
    'telegrambot',
    'twitterbot',
    'slackbot',
    'linkedinbot',
    'pinterest',
    'whatsapp',
    'viber'
  ];
  const ua = userAgent.toLowerCase();
  return botKeywords.some(keyword => ua.includes(keyword));
}

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
  const userAgent = request.headers.get('user-agent');
  const isBot = isSearchBot(userAgent);

  // Nếu là bot, cho phép truy cập các trang giải đấu (/tournaments) để Googlebot lập chỉ mục và Zalo hiển thị preview
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isAllowedRoute = isPublicRoute || (isBot && pathname.startsWith('/tournaments'));

  // Nếu chưa đăng nhập và không ở trang được phép -> redirect về login
  if (!token && !isAllowedRoute) {
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

