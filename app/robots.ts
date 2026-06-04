import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/lecture'],
    },
    sitemap: 'https://www.cdslibrairie.com/sitemap.xml',
  };
}
