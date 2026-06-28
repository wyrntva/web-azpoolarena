import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.1.187', 'localhost'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.187',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.azpoolarena.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cms.poolarena.vn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.poolarena.vn',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '*.poolarena.vn',
        pathname: '/**',
      },
    ],
  },
  // Tối ưu performance
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'framer-motion', 'react-icons'],
  },
};

export default nextConfig;
