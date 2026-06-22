import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  title: 'Giải đấu bida | Poolarena VietNam',
  description:
    'Danh sách các giải đấu bida Việt Nam tại Poolarena. Đăng ký tham gia, theo dõi lịch thi đấu, bảng đấu và kết quả trực tiếp.',
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

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
