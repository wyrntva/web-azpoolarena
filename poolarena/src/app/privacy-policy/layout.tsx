import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  description: 'Cam kết bảo mật thông tin cá nhân, tài khoản đăng ký và lịch sử thanh toán của khách hàng tại Poolarena VietNam.',
  keywords: ['chính sách bảo mật poolarena', 'bảo mật thông tin bida', 'privacy policy poolarena'],
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
  openGraph: {
    title: 'Chính sách bảo mật | Poolarena VietNam',
    description: 'Cam kết bảo mật thông tin cá nhân, tài khoản đăng ký và lịch sử thanh toán của khách hàng tại Poolarena VietNam.',
    url: `${SITE_URL}/privacy-policy`,
    siteName: 'Poolarena VietNam',
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: `${SITE_URL}/images/tour_banner.png`, width: 1200, height: 630, alt: 'Chính sách bảo mật Poolarena VietNam' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chính sách bảo mật | Poolarena VietNam',
    description: 'Cam kết bảo mật thông tin cá nhân của khách hàng tại Poolarena VietNam.',
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Chính sách bảo mật', item: `${SITE_URL}/privacy-policy` },
  ],
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="privacy-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
