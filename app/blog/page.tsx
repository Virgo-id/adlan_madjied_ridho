"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  created_at: string | null;
  title: string;
  slug: string | null;
  category: string | null;
  status: string | null;
  summary: string | null;
  cover_url: string | null;
}

const ITEMS_PER_PAGE = 8; // Dinaikkan ke 8 agar pas dengan kelipatan 4 kolom desktop

export default function BlogPage() {
  const [daftarKarya, setDaftarKarya] = useState<Post[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  const observerTarget = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        if (page === 0) setIsLoadingInitial(true);
        else setIsLoadingMore(true);

        const from = page * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error } = await supabase
          .from("posts")
          .select("id, created_at, title, slug, category, status, summary, cover_url")
          .eq("status", "Published")
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        if (data) {
          setDaftarKarya((prev) => (page === 0 ? data : [...prev, ...data]));
          if (data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error("Gagal memuat arsip blog:", err);
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    }

    fetchPosts();
  }, [page]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore || isLoadingInitial || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, isLoadingInitial, isLoadingMore]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 select-none">
      
      {/* NAVIGASI KEMBALI DI POJOK KIRI ATAS */}
      <div className="absolute left-6 top-8 sm:left-12 sm:top-12 z-50">
        <Link 
          href="/" 
          className="text-xs font-semibold text-zinc-500 flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Beranda
        </Link>
      </div>

      {/* Lebar container dinaikkan ke max-w-6xl agar grid 4 kolom tidak terlalu sempit */}
      <main className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        {/* HEADER HALAMAN */}
        <div className="mb-12 border-b border-zinc-200 dark:border-zinc-900 pb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">
            Arsip Karya
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Semua Tulisan
          </h1>
        </div>

        {/* INTERFACE GRID SYSTEM */}
        {isLoadingInitial ? (
          // Skeleton loader berbentuk Grid 2 kolom mobile / 4 kolom desktop
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
            {[1, 2, 4, 8].map((n) => (
              <div key={n} className="flex flex-col gap-3 animate-pulse">
                <div className="w-full aspect-[4/3] bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
                <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-5 w-5/6 bg-zinc-300 dark:bg-zinc-700" />
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : daftarKarya.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-400">Belum ada karya tulis yang diarsipkan.</p>
          </div>
        ) : (
          <>
            {/* REAL DATA GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
              {daftarKarya.map((karya) => (
                <Link 
                  key={karya.id}
                  href={`/blog/${karya.slug || karya.id}`}
                  className="flex flex-col gap-3 group block"
                >
                  {karya.cover_url && (
                    // Aspek rasio gambar gua ubah ke 4:3 biar lebih rapi dalam bentuk grid kotak
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-sm">
                      <Image
                        src={karya.cover_url}
                        alt={`Sampul ${karya.title}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-102"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    {karya.category && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {karya.category}
                      </span>
                    )}
                    {/* Ukuran teks judul diturunkan dikit ke text-base biar gak makan tempat */}
                    <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 line-clamp-2">
                      {karya.title}
                    </h2>
                    {karya.summary && (
                      // Ditambahkan line-clamp-2 agar ringkasan terpotong otomatis jika kepanjangan
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-0.5">
                        {karya.summary}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Elemen Pemicu Infinite Scroll */}
            <div ref={observerTarget} className="h-16 w-full flex items-center justify-center mt-12 border-t border-zinc-100 dark:border-zinc-900/50">
              {isLoadingMore && (
                <div className="h-5 w-5 animate-spin border-2 border-emerald-500 border-t-transparent rounded-full" />
              )}
              {!hasMore && daftarKarya.length > 0 && (
                <p className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase">
                  Semua karya telah dimuat
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}