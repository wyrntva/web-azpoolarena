import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Bảng xếp hạng',
  description:
    'Bảng xếp hạng cơ thủ bida hàng đầu Việt Nam. Theo dõi thứ hạng, điểm số và thành tích thi đấu theo hệ thống cấp độ Level 1-10 tại Poolarena.',
  keywords: ['bảng xếp hạng bida', 'thứ hạng cơ thủ', 'điểm số cơ thủ', 'xếp hạng bida việt nam', 'level bida 1-10', 'poolarena rankings'],
  alternates: {
    canonical: `${SITE_URL}/rankings`,
  },
  openGraph: {
    title: 'Bảng xếp hạng | Poolarena VietNam',
    description:
      'Bảng xếp hạng cơ thủ bida hàng đầu Việt Nam. Theo dõi thứ hạng, điểm số và thành tích thi đấu theo hệ thống cấp độ Level 1-10 tại Poolarena.',
    url: `${SITE_URL}/rankings`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/tour_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Poolarena VietNam - Bảng xếp hạng',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bảng xếp hạng | Poolarena VietNam',
    description: 'Bảng xếp hạng cơ thủ bida hàng đầu Việt Nam tại Poolarena.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Bảng xếp hạng', item: `${SITE_URL}/rankings` },
  ],
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="rankings-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
