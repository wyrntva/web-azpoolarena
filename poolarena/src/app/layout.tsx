import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Pool Arena - Hệ thống quản lý bida",
  description: "Pool Arena - Hệ thống quản lý câu lạc bộ bida chuyên nghiệp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${montserrat.variable} antialiased`}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
