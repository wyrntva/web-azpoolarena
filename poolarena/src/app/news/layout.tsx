import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Tin tức & Khuyến mãi',
  description: 'Cập nhật tin tức mới nhất về các giải đấu, thông báo và khuyến mãi từ Pool Arena.',
  alternates: {
    canonical: `${SITE_URL}/news`,
  },
  openGraph: {
    title: 'Tin tức & Khuyến mãi | Poolarena VietNam',
    description: 'Cập nhật tin tức mới nhất về các giải đấu, thông báo và khuyến mãi từ Pool Arena.',
    url: `${SITE_URL}/news`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/tour_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Poolarena VietNam - Tin tức & Khuyến mãi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tin tức & Khuyến mãi | Poolarena VietNam',
    description: 'Cập nhật tin tức mới nhất về các giải đấu, thông báo và khuyến mãi từ Pool Arena.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Tin tức & Khuyến mãi', item: `${SITE_URL}/news` },
  ],
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="news-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
