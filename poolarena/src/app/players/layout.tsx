import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Cơ thủ',
  description:
    'Danh sách cơ thủ bida Việt Nam tại Poolarena. Xem thống kê, cấp độ, thành tích thi đấu của các cơ thủ từ Level 1 đến Level 10.',
  keywords: ['cơ thủ bida', 'danh sách cơ thủ', 'thống kê cơ thủ', 'level cơ thủ bida', 'cơ thủ bida việt nam', 'poolarena players'],
  alternates: {
    canonical: `${SITE_URL}/players`,
  },
  openGraph: {
    title: 'Cơ thủ | Poolarena VietNam',
    description:
      'Danh sách cơ thủ bida Việt Nam tại Poolarena. Xem thống kê, cấp độ, thành tích thi đấu của các cơ thủ từ Level 1 đến Level 10.',
    url: `${SITE_URL}/players`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/tour_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Poolarena VietNam - Danh sách cơ thủ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cơ thủ | Poolarena VietNam',
    description: 'Danh sách cơ thủ bida Việt Nam tại Poolarena.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Cơ thủ', item: `${SITE_URL}/players` },
  ],
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="players-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
