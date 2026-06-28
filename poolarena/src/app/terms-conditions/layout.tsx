import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Điều khoản & Điều kiện',
  description: 'Các điều khoản sử dụng dịch vụ, quy định đăng ký tham gia giải đấu và trách nhiệm pháp lý tại Poolarena VietNam.',
  keywords: ['điều khoản poolarena', 'điều kiện sử dụng bida', 'terms conditions poolarena', 'quy định giải đấu bida'],
  alternates: {
    canonical: `${SITE_URL}/terms-conditions`,
  },
  openGraph: {
    title: 'Điều khoản & Điều kiện | Poolarena VietNam',
    description: 'Các điều khoản sử dụng dịch vụ, quy định đăng ký tham gia giải đấu và trách nhiệm pháp lý tại Poolarena VietNam.',
    url: `${SITE_URL}/terms-conditions`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: `${SITE_URL}/images/tour_banner.png`, width: 1200, height: 630, alt: 'Điều khoản & Điều kiện Poolarena VietNam' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Điều khoản & Điều kiện | Poolarena VietNam',
    description: 'Điều khoản sử dụng dịch vụ và quy định tham gia giải đấu tại Poolarena VietNam.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Điều khoản & Điều kiện', item: `${SITE_URL}/terms-conditions` },
  ],
};

export default function TermsConditionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="terms-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
