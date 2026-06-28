import type { Metadata } from "next";
import Script from "next/script";

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://cms.poolarena.vn";
const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://cms.poolarena.vn";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://poolarena.vn";

async function fetchArticle(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/news/${id}`, {
      next: { revalidate: 300 }, // Cache 5 phút
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchArticle(id);

  if (!article) {
    return {
      title: "Bài viết",
      description: "Đọc chi tiết bài viết tin tức tại Poolarena VietNam.",
    };
  }

  const title = `${article.title} | Poolarena VietNam`;
  const description = article.excerpt || "Đọc chi tiết bài viết trên Poolarena VietNam.";
  
  const imageUrl = article.image
    ? article.image.startsWith("http")
      ? article.image
      : `${PUBLIC_API_BASE}${article.image.startsWith("/") ? "" : "/"}${article.image}`
    : `${SITE_URL}/images/tour_banner.png`;

  const pageUrl = `${SITE_URL}/news/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Poolarena VietNam",
      locale: "vi_VN",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ArticleDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await fetchArticle(id);

  const jsonLd = article
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        description: article.excerpt,
        image: article.image
          ? article.image.startsWith("http")
            ? article.image
            : `${PUBLIC_API_BASE}${article.image.startsWith("/") ? "" : "/"}${article.image}`
          : `${SITE_URL}/images/tour_banner.png`,
        datePublished: article.created_at || new Date().toISOString(),
        dateModified: article.updated_at || new Date().toISOString(),
        author: {
          "@type": "Person",
          name: article.author || "Poolarena VietNam",
        },
        publisher: {
          "@type": "Organization",
          name: "Poolarena VietNam",
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/images/logo.png`,
          },
        },
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tin tức & Khuyến mãi", item: `${SITE_URL}/news` },
      ...(article ? [{ "@type": "ListItem", position: 3, name: article.title, item: `${SITE_URL}/news/${id}` }] : []),
    ],
  };

  return (
    <>
      {jsonLd && (
        <Script
          id="news-article-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Script
        id="news-article-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
