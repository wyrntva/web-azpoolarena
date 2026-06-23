import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ theo chuẩn Level 1-10.",
  openGraph: {
    title: "Giới thiệu | Poolarena VietNam",
    description: "POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ theo chuẩn Level 1-10.",
    url: "https://poolarena.vn/info",
    siteName: "Poolarena VietNam",
  },
};

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
