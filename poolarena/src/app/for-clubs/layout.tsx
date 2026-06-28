import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Dành cho câu lạc bộ',
  description: 'Giải pháp số hóa và kết nối hệ thống giải đấu Billiards chuyên nghiệp dành cho các câu lạc bộ bida trên toàn quốc.',
  keywords: ['câu lạc bộ bida', 'phần mềm quản lý bida', 'số hóa câu lạc bộ', 'giải pháp bida', 'poolarena cho câu lạc bộ'],
  alternates: {
    canonical: `${SITE_URL}/for-clubs`,
  },
  openGraph: {
    title: 'Dành cho câu lạc bộ | Poolarena VietNam',
    description: 'Giải pháp số hóa và kết nối hệ thống giải đấu Billiards chuyên nghiệp dành cho các câu lạc bộ bida trên toàn quốc.',
    url: `${SITE_URL}/for-clubs`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: `${SITE_URL}/images/tour_banner.png`, width: 1200, height: 630, alt: 'Poolarena dành cho câu lạc bộ bida' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dành cho câu lạc bộ | Poolarena VietNam',
    description: 'Giải pháp số hóa hệ thống giải đấu Billiards cho các câu lạc bộ bida.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Dành cho câu lạc bộ', item: `${SITE_URL}/for-clubs` },
  ],
};

export default function ForClubsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="for-clubs-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
