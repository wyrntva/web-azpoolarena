import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Dành cho đơn vị tổ chức giải',
  description: 'Công cụ và nền tảng quản lý bốc thăm, xếp nhánh, cập nhật kết quả thi đấu thời gian thực cho ban tổ chức giải đấu bida.',
  keywords: ['tổ chức giải bida', 'phần mềm quản lý giải đấu', 'bốc thăm bida', 'xếp nhánh bida', 'ban tổ chức giải bida'],
  alternates: {
    canonical: `${SITE_URL}/for-organizers`,
  },
  openGraph: {
    title: 'Dành cho đơn vị tổ chức giải | Poolarena VietNam',
    description: 'Công cụ và nền tảng quản lý bốc thăm, xếp nhánh, cập nhật kết quả thi đấu thời gian thực cho ban tổ chức giải đấu bida.',
    url: `${SITE_URL}/for-organizers`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: `${SITE_URL}/images/tour_banner.png`, width: 1200, height: 630, alt: 'Poolarena dành cho đơn vị tổ chức giải' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dành cho đơn vị tổ chức giải | Poolarena VietNam',
    description: 'Nền tảng quản lý giải đấu bida chuyên nghiệp cho ban tổ chức.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Dành cho đơn vị tổ chức giải', item: `${SITE_URL}/for-organizers` },
  ],
};

export default function ForOrganizersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="for-organizers-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
