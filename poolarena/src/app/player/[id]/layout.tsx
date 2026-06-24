import type { Metadata } from 'next';
import Script from 'next/script';
import { formatFullLevel } from '@/lib/tournament-utils';

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.poolarena.vn';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

async function fetchPlayer(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/pool-arena/users/${id}`, {
      next: { revalidate: 300 },
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
  const player = await fetchPlayer(id);

  if (!player) {
    return {
      title: 'Cơ thủ',
      description: 'Xem thông tin, thống kê và thành tích thi đấu của cơ thủ tại Poolarena VietNam.',
    };
  }

  const name = player.full_name || 'Cơ thủ';
  const rank = player.rank ? formatFullLevel(player.rank) : '';
  const title = `${name}${rank ? ` (${rank})` : ''}`;
  const description = `Xem thống kê thi đấu của ${name}${rank ? ` - ${rank}` : ''} tại Poolarena VietNam. Tỉ lệ thắng, điểm số và thành tích nổi bật.`;

  const avatarUrl = player.avatar_url
    ? player.avatar_url.startsWith('http')
      ? player.avatar_url
      : `${API_BASE}${player.avatar_url}`
    : `${SITE_URL}/images/tour_banner.png`;

  const pageUrl = `${SITE_URL}/player/${id}`;

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
      siteName: 'Poolarena VietNam',
      locale: 'vi_VN',
      type: 'profile',
      images: [
        {
          url: avatarUrl,
          width: 400,
          height: 400,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [avatarUrl],
    },
  };
}

export default async function PlayerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await fetchPlayer(id);

  const jsonLd = player
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: player.full_name,
        url: `${SITE_URL}/player/${id}`,
        ...(player.avatar_url && {
          image: player.avatar_url.startsWith('http')
            ? player.avatar_url
            : `${API_BASE}${player.avatar_url}`,
        }),
        ...(player.rank && { description: `Cơ thủ bida Level ${player.rank} tại Poolarena VietNam` }),
        memberOf: {
          '@type': 'Organization',
          name: 'Poolarena VietNam',
          url: SITE_URL,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="player-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
