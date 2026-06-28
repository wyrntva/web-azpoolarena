import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Giới thiệu',
  description: 'Tìm hiểu về Poolarena VietNam - Hệ thống giải đấu bida hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ.',
  keywords: ['về poolarena', 'poolarena là gì', 'az pool arena', 'hệ thống bida việt nam', 'giới thiệu poolarena'],
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'Giới thiệu | Poolarena VietNam',
    description: 'Tìm hiểu về Poolarena VietNam - Hệ thống giải đấu bida hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ.',
    url: `${SITE_URL}/about`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: `${SITE_URL}/images/tour_banner.png`, width: 1200, height: 630, alt: 'Giới thiệu Poolarena VietNam' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giới thiệu | Poolarena VietNam',
    description: 'Tìm hiểu về Poolarena VietNam - Hệ thống giải đấu bida hàng đầu Việt Nam.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Giới thiệu', item: `${SITE_URL}/about` },
  ],
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="about-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
