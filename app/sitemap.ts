// app/sitemap.ts
import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://domain-kamu.com'; // Ganti dengan domain aslimu

  // Ambil semua slug blog aktif dari Supabase untuk didaftarkan ke Google
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, created_at')
    .eq('status', 'published'); // pastikan hanya yang sudah rilis

  const blogUrls = posts?.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.created_at ? new Date(post.created_at) : new Date(),
  })) || [];

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    ...blogUrls,
  ];
}