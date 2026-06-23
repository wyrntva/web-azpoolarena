import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  weight: ["400", "500", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: 'V4fyIm9vnGN9f4Z5d7V9ZEKtdFsbK3e52GuT4B3E6wM',
  },
  title: {
    default: "Poolarena VietNam",
    template: "%s | Poolarena VietNam",
  },
  description: "POOLARENA.VN - Hệ thống giải đấu bida hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Poolarena VietNam",
    description: "POOLARENA.VN - Hệ thống giải đấu bida hàng đầu Việt Nam.",
    url: SITE_URL,
    siteName: "Poolarena VietNam",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/images/tour_banner.png`,
        width: 1200,
        height: 630,
        alt: "Poolarena VietNam",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Poolarena VietNam",
    description: "POOLARENA.VN - Hệ thống giải đấu bida hàng đầu Việt Nam.",
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${montserrat.variable} antialiased`}>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
        <GoogleAnalytics gaId={GA_ID || ""} />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
