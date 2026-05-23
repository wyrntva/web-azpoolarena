"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Các route cần đăng nhập (phía client)
const protectedRoutes = ['/myprofile', '/dashboard'];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Chỉ check auth cho protected routes
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [pathname, router]);

  // KHÔNG blocking render - render children ngay lập tức
  // Middleware đã xử lý redirect ở server-side
  return <>{children}</>;
}
