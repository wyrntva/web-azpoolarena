"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Các route cần đăng nhập (phía client)
const protectedRoutes = ['/myprofile', '/dashboard', '/tournaments'];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);
  const [tokenExists, setTokenExists] = useState(false);

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    setIsMounted(true);
    if (isProtectedRoute) {
      const token = localStorage.getItem('token');
      const exists = !!token;
      setTokenExists(exists);
      setHasCheckedToken(true);
      if (!exists) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    } else {
      setHasCheckedToken(false);
      setTokenExists(false);
    }
  }, [pathname, router, isProtectedRoute]);

  // SSR or hydration: if it is a protected route, render loading state
  // This matches server-side structure (loading/null) and prevents hydration issues
  if (!isMounted && isProtectedRoute) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // If it's a protected route, wait until we check the token on client side
  if (isProtectedRoute && !hasCheckedToken) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // If it's a protected route, and the token does not exist, show loading spinner (redirect in progress)
  if (isProtectedRoute && !tokenExists) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
