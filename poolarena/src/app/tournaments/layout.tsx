import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Giải đấu bida',
  description:
    'Danh sách các giải đấu bida Việt Nam tại Poolarena. Đăng ký tham gia, theo dõi lịch thi đấu, bảng đấu và kết quả trực tiếp.',
  keywords: ['giải đấu bida', 'lịch thi đấu bida', 'đăng ký giải bida', 'bảng đấu bida', 'kết quả giải bida', 'poolarena tournaments'],
  alternates: {
    canonical: `${SITE_URL}/tournaments`,
  },
  openGraph: {
    title: 'Giải đấu bida | Poolarena VietNam',
    description:
      'Danh sách các giải đấu bida Việt Nam tại Poolarena. Đăng ký tham gia, theo dõi lịch thi đấu, bảng đấu và kết quả trực tiếp.',
    url: `${SITE_URL}/tournaments`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/tour_banner.png`,
        width: 1200,
        height: 630,
        alt: 'Poolarena VietNam - Giải đấu bida',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giải đấu bida | Poolarena VietNam',
    description: 'Danh sách các giải đấu bida Việt Nam tại Poolarena.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Giải đấu bida', item: `${SITE_URL}/tournaments` },
  ],
};

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="tournaments-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
