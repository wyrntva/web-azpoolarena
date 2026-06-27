import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Poolarena VietNam",
  verification: {
    google: 'V4fyIm9vnGN9f4Z5d7V9ZEKtdFsbK3e52GuT4B3E6wM',
  },
  title: {
    default: "Poolarena VietNam",
    template: "%s | Poolarena VietNam",
  },
  description: "POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam. Theo dõi giải đấu, bảng xếp hạng và thành tích cơ thủ.",
  keywords: ["bida", "billiards", "giải đấu bida", "cơ thủ bida", "bảng xếp hạng bida", "lịch thi đấu bida", "kết quả bida", "poolarena", "pool arena", "bida việt nam"],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Poolarena VietNam",
    description: "POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam.",
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
    description: "POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam.",
    images: [`${SITE_URL}/images/tour_banner.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Poolarena VietNam",
    "alternateName": ["Pool Arena", "Poolarena"],
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/news?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Poolarena VietNam",
    "alternateName": ["Pool Arena", "AZ Pool Arena"],
    "url": SITE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}/images/logo.png`,
      "width": 200,
      "height": 200,
    },
    "sameAs": [
      "https://www.facebook.com/poolarena.vn",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Vietnamese",
    },
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "name": "AZ Pool Arena",
    "description": "Hệ thống câu lạc bộ bida và tổ chức giải đấu bida chuyên nghiệp tại Việt Nam.",
    "url": SITE_URL,
    "logo": `${SITE_URL}/images/logo.png`,
    "image": `${SITE_URL}/images/tour_banner.png`,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "VN",
      "addressLocality": "Hồ Chí Minh",
    },
    "sport": "Billiards",
    "sameAs": [
      "https://www.facebook.com/poolarena.vn",
    ],
  };

  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://cms.poolarena.vn" />
        <link rel="dns-prefetch" href="https://cms.poolarena.vn" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
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
                gtag('config', '${GA_ID}', { send_page_view: false });
              `}
            </Script>
          </>
        )}
        <GoogleAnalytics gaId={GA_ID || ""} />
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Script
          id="localbusiness-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

