import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Liên hệ hợp tác',
  description: 'Liên hệ hợp tác thương mại, quảng cáo và phát triển cùng hệ thống bida Poolarena VietNam.',
  keywords: ['liên hệ poolarena', 'hợp tác bida', 'quảng cáo poolarena', 'đối tác poolarena'],
  alternates: {
    canonical: `${SITE_URL}/contact-cooperation`,
  },
  openGraph: {
    title: 'Liên hệ hợp tác | Poolarena VietNam',
    description: 'Liên hệ hợp tác thương mại, quảng cáo và phát triển cùng hệ thống bida Poolarena VietNam.',
    url: `${SITE_URL}/contact-cooperation`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: `${SITE_URL}/images/tour_banner.png`, width: 1200, height: 630, alt: 'Liên hệ hợp tác Poolarena VietNam' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liên hệ hợp tác | Poolarena VietNam',
    description: 'Liên hệ hợp tác thương mại, quảng cáo và phát triển cùng Poolarena VietNam.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Liên hệ hợp tác', item: `${SITE_URL}/contact-cooperation` },
  ],
};

export default function ContactCooperationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="contact-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
