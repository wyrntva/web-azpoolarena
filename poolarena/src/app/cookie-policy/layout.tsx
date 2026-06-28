import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Chính sách Cookie',
  description: 'Tìm hiểu cách Poolarena VietNam sử dụng cookie để tối ưu hóa và mang lại trải nghiệm tốt nhất cho bạn trên website.',
  keywords: ['chính sách cookie poolarena', 'cookie policy bida', 'cookie website bida'],
  alternates: {
    canonical: `${SITE_URL}/cookie-policy`,
  },
  openGraph: {
    title: 'Chính sách Cookie | Poolarena VietNam',
    description: 'Tìm hiểu cách Poolarena VietNam sử dụng cookie để tối ưu hóa và mang lại trải nghiệm tốt nhất cho bạn trên website.',
    url: `${SITE_URL}/cookie-policy`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: `${SITE_URL}/images/tour_banner.png`, width: 1200, height: 630, alt: 'Chính sách Cookie Poolarena VietNam' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chính sách Cookie | Poolarena VietNam',
    description: 'Cách Poolarena VietNam sử dụng cookie để cải thiện trải nghiệm người dùng.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Chính sách Cookie', item: `${SITE_URL}/cookie-policy` },
  ],
};

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="cookie-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
