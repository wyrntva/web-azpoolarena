import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Sự kiện bida',
  description:
    'Danh sách các sự kiện bida Việt Nam tại Poolarena. Đăng ký tham gia, theo dõi lịch thi đấu, bảng đấu và kết quả trực tiếp.',
  keywords: ['sự kiện bida', 'giải đấu bida', 'lịch thi đấu bida', 'đăng ký sự kiện bida', 'bảng đấu bida', 'kết quả sự kiện bida', 'poolarena events'],
  alternates: {
    canonical: `${SITE_URL}/events`,
  },
  openGraph: {
    title: 'Sự kiện bida | Poolarena VietNam',
    description:
      'Danh sách các sự kiện bida Việt Nam tại Poolarena. Đăng ký tham gia, theo dõi lịch thi đấu, bảng đấu và kết quả trực tiếp.',
    url: `${SITE_URL}/events`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/tour_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Poolarena VietNam - Sự kiện bida',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sự kiện bida | Poolarena VietNam',
    description: 'Danh sách các sự kiện bida Việt Nam tại Poolarena.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Sự kiện bida', item: `${SITE_URL}/events` },
  ],
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="events-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
