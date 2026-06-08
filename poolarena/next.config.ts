import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
