"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [karya, setKarya] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPostDetail() {
      try {
        setIsLoading(true);
        
        // 1. Coba ambil data berdasarkan slug terlebih dahulu
        let { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("slug", resolvedParams.slug)
          .single();

        // 2. Fallback: Kalau gagal/tidak ketemu lewat slug, coba cari pakai UUID (id)
        if (error || !data) {
          const { data: fallbackData } = await supabase
            .from("posts")
            .select("*")
            .eq("id", resolvedParams.slug)
            .single();
          
          if (fallbackData) data = fallbackData;
        }

        if (data) {
          // Kunci pengaman anti-refresh spam pake sessionStorage
          const sessionKey = `viewed_${data.id}`;
          const hasViewed = sessionStorage.getItem(sessionKey);

          if (!hasViewed) {
            // Kalau beneran kunjungan pertama di sesi tab ini, tembak RPC ke DB
            await supabase.rpc("increment_views", { post_id: data.id });
            sessionStorage.setItem(sessionKey, "true");

            // Tampilan UI lokal langsung ditambah 1 biar sinkron instant
            setKarya({
              ...data,
              views: (data.views || 0) + 1
            });
          } else {
            // Kalau cuma hasil refresh, set data asli tanpa nembak RPC lagi
            setKarya(data);
          }
        }
      } catch (err) {
        console.error("Gagal memuat isi artikel:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPostDetail();
  }, [resolvedParams.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!karya) {
    return (
      <div className="min-h-screen bg-zinc-50 text-center flex flex-col items-center justify-center dark:bg-zinc-950 px-6">
        <p className="text-zinc-400 text-sm mb-4">Karya tulis tidak ditemukan atau sudah dihapus.</p>
        <Link href="/blog" className="text-xs font-bold text-emerald-500 underline">Kembali ke Arsip</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      
      {/* TIGA MENU NAVIGASI MINIMALIS */}
      <div className="absolute left-6 top-8 sm:left-12 sm:top-12 z-50 flex items-center gap-3 text-xs font-semibold text-zinc-500 select-none">
        <button 
          onClick={() => router.back()} 
          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Kembali
        </button>
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
          <div className="mb-8 border-l-2 border-emerald-500 pl-4 italic text-zinc-600 dark:text-zinc-400 text-sm">
            {karya.summary}
          </div>
        )}

        {/* ISI KONTEN UTAMA */}
        <div className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-6 whitespace-pre-line break-words">
          {karya.content}
        </div>

        {/* KARTU BIOGRAFI PENULIS */}
        <div className="mt-16 border-t border-zinc-200 dark:border-zinc-900 pt-8 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Penulis</span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {karya.author || "Adlan Madjied Ridho"}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {karya.bio || "Penulis asal Jember yang mendalami website dan literasi."}
          </p>
        </div>
      </article>
    </div>
  );
}