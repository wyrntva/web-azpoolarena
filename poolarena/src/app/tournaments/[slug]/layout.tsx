import type { Metadata } from 'next';
import Script from 'next/script';

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://cms.poolarena.vn';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

async function fetchTournament(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/tournaments/slug/${slug}`, {
      next: { revalidate: 60 },
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchTournament(slug);

  if (!data) {
    return {
      title: 'Giải đấu',
      description: 'Xem thông tin chi tiết về giải đấu bida tại Poolarena VietNam',
    };
  }

  const title = data.name;
  const location = data.location || 'AZ Pool Arena';
  const description = `Giải đấu bida ${data.name} tại ${location}. Đăng ký tham gia ngay tại Poolarena VietNam!`;

  const rawBanner = data.banner || data.detail_logo || null;
  const imageUrl = rawBanner
    ? rawBanner.startsWith('http')
      ? rawBanner
      : `${PUBLIC_API_BASE}${rawBanner}`
    : `${SITE_URL}/images/tour_banner.png`;

  const pageUrl = `${SITE_URL}/tournaments/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Poolarena VietNam',
      locale: 'vi_VN',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: data.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function TournamentSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchTournament(slug);

  const jsonLd = data
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: data.name,
        url: `${SITE_URL}/tournaments/${slug}`,
        description: `Giải đấu bida ${data.name} tại ${data.location || 'AZ Pool Arena'}.`,
        location: {
          '@type': 'Place',
          name: data.location || 'AZ Pool Arena',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'VN',
          },
        },
        organizer: {
          '@type': 'Organization',
          name: 'Poolarena VietNam',
          url: SITE_URL,
        },
        ...(data.start_date && { startDate: data.start_date }),
        ...(data.end_date && { endDate: data.end_date }),
        ...(data.banner || data.detail_logo
          ? {
              image: (() => {
                const raw = data.banner || data.detail_logo;
                return raw.startsWith('http') ? raw : `${PUBLIC_API_BASE}${raw}`;
              })(),
            }
          : {}),
        sport: 'Billiards',
      }
    : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="tournament-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
