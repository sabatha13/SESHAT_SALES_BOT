import type { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

const BASE_URL = 'https://www.cdslibrairie.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/boutique`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/packs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/chemin`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/auteur`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/abonnement`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    const supabase = createServerClient();
    const { data: books } = await supabase
      .from('books')
      .select('id, updated_at')
      .eq('is_published', true);

    const bookRoutes: MetadataRoute.Sitemap = (books || []).map((book) => ({
      url: `${BASE_URL}/livre/${book.id}`,
      lastModified: book.updated_at ? new Date(book.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...bookRoutes];
  } catch {
    return staticRoutes;
  }
}
