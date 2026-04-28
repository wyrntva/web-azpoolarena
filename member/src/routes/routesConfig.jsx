import { lazy } from 'react';

const Home = lazy(() => import('../pages/Home.jsx'));
const Member = lazy(() => import('../pages/Member.jsx'));
const Promo = lazy(() => import('../pages/Promo.jsx'));
const Security = lazy(() => import('../pages/Security.jsx'));
const Download = lazy(() => import('../pages/Download.jsx'));

export const routesConfig = [
  { path: '/home', element: Home },
  { path: '/member', element: Member },
  { path: '/promo', element: Promo },
  { path: '/security', element: Security },
  { path: '/download', element: Download },
];
