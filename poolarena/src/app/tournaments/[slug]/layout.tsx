import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
      title: 'Giải đấu - Poolarena VietNam',
      description: 'Xem thông tin chi tiết về giải đấu bida tại Poolarena VietNam',
    };
  }

  const title = `${data.name} - Poolarena VietNam`;
  const location = data.location || 'AZ Pool Arena';
  const description = `Giải đấu bida ${data.name} tại ${location}. Đăng ký tham gia ngay tại Poolarena VietNam!`;

  const rawBanner = data.banner || data.detail_logo || null;
  const imageUrl = rawBanner
    ? rawBanner.startsWith('http')
      ? rawBanner
      : `${API_BASE}${rawBanner}`
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

export default function TournamentSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
