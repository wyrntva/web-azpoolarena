import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://poolarena.vn";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ theo chuẩn Level 1-10.",
  keywords: ["poolarena", "giới thiệu poolarena", "hệ thống bida việt nam", "az pool arena", "giải đấu bida", "cấp độ bida level 1-10"],
  alternates: {
    canonical: `${SITE_URL}/info`,
  },
  openGraph: {
    title: "Giới thiệu | Poolarena VietNam",
    description: "POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ theo chuẩn Level 1-10.",
    url: `${SITE_URL}/info`,
    siteName: "Poolarena VietNam",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/images/tour_banner.png`,
        width: 1200,
        height: 630,
        alt: "Poolarena VietNam - Giới thiệu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Giới thiệu | Poolarena VietNam",
    description: "POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ theo chuẩn Level 1-10.",
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
