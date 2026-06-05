// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',            // Mengizinkan Google mengindeks halaman utama & publik
      disallow: '/admin/',
    },
    sitemap: 'https://domain-anda.com/sitemap.xml', // Sesuaikan dengan domain Anda
  };
}