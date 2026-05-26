// app/blog/[slug]/page.tsx
// (TIDAK ADA "use client" DI SINI. Ini Server Component murni!)

// 1. SEMUA IMPORT DIKUMPULKAN DI PALING ATAS
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavigasiKembali, TrackerViews } from "../ClientFeatures";

interface Post {
  id: string;
  created_at: string | null;
  title: string;
  slug: string | null;
  category: string | null;
  status: string | null;
  views: number | null;
  content: string | null;
  summary: string | null;
  author: string | null;
  bio: string | null;
  cover_url: string | null;
}

// 2. FUNGSI GENERATE METADATA UNTUK ROBOT GOOGLE
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  
  const { data: karya } = await supabase
    .from("posts")
    .select("title, summary")
    .eq("slug", resolvedParams.slug)
    .single();

  if (!karya) return { title: "Karya Tidak Ditemukan" };

  return {
    title: `${karya.title} | Blog AMR`,
    description: karya.summary || "Baca karya tulis terbaru di portfolio AMR.",
    openGraph: {
      title: karya.title,
      description: karya.summary || "Baca karya tulis terbaru di portfolio AMR.",
    }
  };
}

// 3. KOMPONEN UTAMA HALAMAN
export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  // Ambil data langsung dari server saat halaman diminta
  let { data: karya } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", resolvedParams.slug)
    .single();

  // Fallback ke ID jika slug tidak ditemukan
  if (!karya) {
    const { data: fallbackData } = await supabase
      .from("posts")
      .select("*")
      .eq("id", resolvedParams.slug)
      .single();
    
    if (fallbackData) karya = fallbackData;
  }

  // Jika data tetap tidak ada di database, langsung lempar ke halaman 404 bawaan Next.js
  if (!karya) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      
      {/* Pemicu penambah views di background (Client Side) */}
      <TrackerViews postId={karya.id} />

      {/* MENU NAVIGASI MINIMALIS */}
      <div className="absolute left-6 top-8 sm:left-12 sm:top-12 z-50 flex items-center gap-3 text-xs font-semibold text-zinc-500 select-none">
        <NavigasiKembali />
        <span className="text-zinc-300 dark:text-zinc-800">|</span>
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          Beranda
        </Link>
        <span className="text-zinc-300 dark:text-zinc-800">|</span>
        <Link href="/blog" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          Semua Blog
        </Link>
      </div>

      <article className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
        {/* METADATA ATAS */}
        <div className="mb-6">
          {karya.category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-2">
              {karya.category}
            </span>
          )}
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl leading-tight">
            {karya.title}
          </h1>
          
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-3">
            {karya.created_at && (
              <span>
                {new Date(karya.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
            <span>•</span>
            <span>{karya.views || 0} kali dibaca</span>
          </div>
        </div>

        {/* COVER IMAGE */}
        {karya.cover_url && (
          <div className="relative w-full aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-8">
            <Image
              src={karya.cover_url}
              alt={`Sampul ${karya.title}`}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* RINGKASAN/SUMMARY (JIKA ADA) */}
        {karya.summary && (
          <div className="mb-8 border-l-2 border-emerald-500 pl-4 italic text-zinc-600 dark:text-zinc-400 text-sm text-justify">
            {karya.summary}
          </div>
        )}

        {/* ISI KONTEN UTAMA (RATA KANAN-KIRI & MARGIN PARAGRAF ASLI 1.5REM) */}
        <div className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed text-justify break-words mb-8">
          {karya.content
            ? karya.content.split("\n").map((paragraf, index) => {
                if (paragraf.trim() === "") return <div key={index} className="h-4" />;
                
                return (
                  <p key={index} className="mb-6">
                    {paragraf}
                  </p>
                );
              })
            : null}
        </div>

        {/* KARTU BIOGRAFI PENULIS */}
        <div className="mt-16 border-t border-zinc-200 dark:border-zinc-900 pt-8 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Penulis</span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {karya.author || "Adlan Madjied Ridho"}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed text-justify">
            {karya.bio || "Penulis asal Jember yang mendalami website dan literasi."}
          </p>
        </div>
      </article>
    </div>
  );
}