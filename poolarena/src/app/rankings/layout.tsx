import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Bảng xếp hạng',
  description:
    'Bảng xếp hạng cơ thủ bida hàng đầu Việt Nam. Theo dõi thứ hạng, điểm số và thành tích thi đấu theo hệ thống cấp độ Level 1-10 tại Poolarena.',
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

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
