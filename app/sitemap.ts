// app/sitemap.ts
import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://adlanmr.vercel.app';

  // Ambil semua slug blog aktif dari Supabase untuk didaftarkan ke Google
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, created_at')
    .eq('status', 'published'); // pastikan hanya yang sudah rilis

  // Mapping URL untuk setiap artikel blog
  const blogUrls = posts?.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString(),
    changeFrequency: 'weekly' as const, // artikel blog jarang berubah setelah rilis, tapi mungkin ada update komparatif
    priority: 0.7, // prioritas sedang untuk artikel tunggal
  })) || [];

  return [
    { 
      url: baseUrl, 
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily', // Halaman utama biasanya paling sering berubah atau dipantau Google
      priority: 1.0, // Prioritas tertinggi untuk halaman utama
    },
    { 
      url: `${baseUrl}/blog`, 
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly', // List blog diperbarui setiap kali ada artikel baru
      priority: 0.8, // Prioritas tinggi untuk halaman indeks blog
    },
    ...blogUrls,
  ];
}