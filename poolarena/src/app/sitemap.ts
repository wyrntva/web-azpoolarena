import type { MetadataRoute } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.poolarena.vn';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poolarena.vn';

async function fetchTournaments(): Promise<{ slug: string; updated_at?: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tournaments/public`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchUsers(): Promise<{ id: number; updated_at?: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/api/pool-arena/users`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tournaments, users] = await Promise.all([fetchTournaments(), fetchUsers()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/tournaments`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/rankings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/players`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/info`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms-conditions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const tournamentRoutes: MetadataRoute.Sitemap = tournaments
    .filter((t) => t.slug)
    .map((t) => ({
      url: `${SITE_URL}/tournaments/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  const playerRoutes: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${SITE_URL}/player/${u.id}`,
    lastModified: u.updated_at ? new Date(u.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...tournamentRoutes, ...playerRoutes];
}
