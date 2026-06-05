"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ==========================================
// INTERFACE DATA SUPABASE
// ==========================================
interface Post {
  id: string;
  created_at: string | null;
  title: string;
  slug: string | null;
  category: string | null;
  status: string | null;
  summary: string | null;
  cover_url: string | null;
  views?: number | null;
  content?: string | null;
  author?: string | null;
  bio?: string | null;
}

const ITEMS_PER_PAGE = 4;

// ==========================================
// 1. KOMPONEN HEADER (SEAMLESS - NO BORDER)
// ==========================================
function Header() {
  return (
    <header className="w-full bg-zinc-950">
      <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-black tracking-widest text-zinc-50">
          AMR
        </Link>
        <Link 
          href="/customer/chat" 
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]"
        >
          Hubungi Saya
        </Link>
      </div>
    </header>
  );
}

// ==========================================
// 2. KOMPONEN HERO PROFIL
// ==========================================
function HeroProfil({ umur, onSecretClick }: { umur: number | string; onSecretClick: () => void }) {
  return (
    <div className="flex flex-col justify-center h-full gap-8 py-4">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start text-center sm:text-left">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-zinc-900 shadow-sm sm:h-32 sm:w-32">
          <Image
            src="/image/profil/profile.jpg"
            alt="Adlan Madjied Ridho"
            fill
            sizes="(max-width: 640px) 112px, 128px"
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 sm:text-4xl">
            Adlan Madjied Ridho
          </h1>
          <p className="mt-3 text-base text-zinc-400 leading-relaxed">
            Santri Annuqayah yang mendalami pengembangan situs web dan karya tulis.
          </p>
        </div>
      </div>

      <div className="pt-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-4">
          Identitas Diri
        </h2>
        <ul className="grid grid-cols-1 gap-3 text-base text-zinc-400 sm:grid-cols-2">
          <li>
            <span 
              onClick={onSecretClick} 
              className="font-semibold text-zinc-100 cursor-default select-none transition-colors active:text-blue-500"
              title="Identity"
            >
              Nama:
            </span>{" "}
            Adlan Madjied Ridho
          </li>
          <li><span className="font-semibold text-zinc-100">Panggilan:</span> Aji</li>
          <li><span className="font-semibold text-zinc-100">Umur:</span> {umur} {typeof umur === "number" && "tahun"}</li>
          <li><span className="font-semibold text-zinc-100">Lahir:</span> 01 September 2007</li>
          <li><span className="font-semibold text-zinc-100">Zodiak:</span> Virgo</li>
          <li><span className="font-semibold text-zinc-100">Alamat:</span> Sukogidri, Ledokombo, Jember</li>
        </ul>
      </div>
    </div>
  );
}

// ==========================================
// 3. KOMPONEN HISTORI
// ==========================================
function Histori() {
  return (
    <div className="flex flex-col justify-center h-full gap-8 py-4">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">
            Riwayat Jabatan
          </h2>
          <ul className="space-y-4 pl-4 border-l-2 border-blue-600">
            <li className="flex flex-col">
              <span className="font-semibold text-zinc-100 text-base">Basis Data & Inventaris</span>
              <span className="text-sm text-zinc-500">Perpustakaan Lubangsa</span>
            </li>
            <li className="flex flex-col">
              <span className="font-semibold text-zinc-100 text-base">Sekretaris</span>
              <span className="text-sm text-zinc-500">Perpustakaan Lubangsa</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">
            Riwayat Pendidikan
          </h2>
          <div className="relative pl-4 border-l-2 border-zinc-900 space-y-3">
            {["Universitas Annuqayah", "MA 1 Annuqayah", "MTs Nurul Mannan", "MI Nurul Mannan", "Taman Kanak-kanak"].map((edu, idx) => (
              <div key={idx} className="relative text-base text-zinc-400">
                <div className={`absolute -left-[22px] top-2 h-2 w-2 rounded-full ring-4 ring-zinc-950 ${idx === 0 ? "bg-blue-500" : "bg-zinc-700"}`} />
                <span className={idx === 0 ? "font-bold text-blue-400" : ""}>
                  {edu}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. KOMPONEN KARYA TULIS (HORIZONTAL SCROLL)
// ==========================================
function KaryaTulis() {
  const [daftarKarya, setDaftarKarya] = useState<Post[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  const observerTarget = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

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
        console.error("Gagal memuat karya tulis:", err);
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    }
    fetchPosts();
  }, [page, mounted]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore || isLoadingInitial || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { 
        threshold: 0.1,
        root: target.parentElement
      }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, isLoadingInitial, isLoadingMore]);

  if (!mounted) {
    return <div className="h-full py-12" />;
  }

  return (
    <div className="flex flex-col justify-between h-full py-12 gap-6">
      
      {/* JUDUL & TOMBOL SEMUA KARYA */}
      <div className="shrink-0 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">
          Karya Tulis
        </h2>
        <Link 
          href="/blog" 
          className="text-xs font-semibold text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          Semua Karya
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* AREA SCROLL HORIZONTAL */}
      <div className="grow flex items-center overflow-x-auto overflow-y-hidden pb-4 gap-5 snap-x snap-mandatory [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
        {isLoadingInitial ? (
          /* SKELETON */
          [1, 2, 3].map((n) => (
            <div key={n} className="flex flex-col gap-3 min-w-[240px] w-[240px] sm:min-w-[280px] sm:w-[280px] animate-pulse shrink-0">
              <div className="w-full aspect-[4/3] bg-zinc-800 rounded-sm" />
              <div className="h-3 w-12 bg-zinc-800" />
              <div className="h-5 w-5/6 bg-zinc-700" />
              <div className="h-3 w-full bg-zinc-800" />
            </div>
          ))
        ) : daftarKarya.length === 0 ? (
          <div className="w-full text-center py-12">
            <p className="text-sm text-zinc-500">Belum ada karya tulis yang diterbitkan.</p>
          </div>
        ) : (
          <>
            {daftarKarya.map((karya) => (
              <Link 
                key={karya.id}
                href={`/blog/${karya.slug || karya.id}`}
                className="flex flex-col gap-2.5 group shrink-0 min-w-[240px] w-[240px] sm:min-w-[260px] sm:w-[260px] snap-always snap-center block"
              >
                {karya.cover_url && (
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-900 rounded-sm">
                    <Image
                      src={karya.cover_url}
                      alt={`Sampul ${karya.title}`}
                      fill
                      sizes="(max-width: 640px) 240px, 260px"
                      className="object-cover transition-transform duration-500 group-hover:scale-102"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {karya.category && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                      {karya.category}
                    </span>
                  )}

                  <h3 className="font-bold text-sm text-zinc-100 tracking-tight leading-snug group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                    {karya.title}
                  </h3>

                  {karya.summary && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 mt-0.5">
                      {karya.summary}
                    </p>
                  )}
                </div>
              </Link>
            ))}

            {/* TRIGGER INFINITE SCROLL */}
            <div ref={observerTarget} className="shrink-0 flex flex-col items-center justify-center min-w-[100px] h-full pl-4 snap-center">
              {isLoadingMore ? (
                <div className="h-4 w-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
              ) : !hasMore && daftarKarya.length > 0 ? (
                <p className="text-[9px] font-semibold text-zinc-500 tracking-wider uppercase text-center vertical-text writing-mode-vertical">
                  Habis
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. KOMPONEN PORTFOLIO & CONTACT
// ==========================================
function PortfolioContact({ tahun }: { tahun: number | string }) {
  return (
    <div className="flex flex-col justify-between h-full py-4">
      <div className="my-auto space-y-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500">
            Mari Terhubung
          </h2>
          <p className="text-base text-zinc-400">
            Punya ide proyek web, diskusi karya tulis, atau sekadar ingin menyapa? Silakan kirim pesan langsung melalui tombol chat di bawah ini.
          </p>
          
          <div className="mt-2">
            <Link 
              href="/customer/chat"
              className="inline-block bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              Chat Sekarang
            </Link>
          </div>
        </div>
      </div>

      <footer className="w-full pt-6 text-center">
        <p className="text-xs text-zinc-600 tracking-wide">
          &copy; {tahun} AMR. Hak Cipta Dilindungi Undang-Undang.
        </p>
      </footer>
    </div>
  );
}

// ==========================================
// HALAMAN UTAMA (HOME - SEAMLESS MODE)
// ==========================================
export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [umurAji, setUmurAji] = useState<number | string>("-");
  const [tahunSekarang, setTahunSekarang] = useState<number | string>("");

  const slideRefs = [
    useRef<HTMLElement>(null), 
    useRef<HTMLElement>(null), 
    useRef<HTMLElement>(null),
    useRef<HTMLElement>(null)
  ];
  const router = useRouter();

  useEffect(() => {
    const hariIni = new Date();
    const tanggalLahir = new Date("2007-09-01");
    let hitungUmur = hariIni.getFullYear() - tanggalLahir.getFullYear();
    const bulan = hariIni.getMonth() - tanggalLahir.getMonth();
    
    if (bulan < 0 || (bulan === 0 && hariIni.getDate() < tanggalLahir.getDate())) {
      hitungUmur--;
    }
    
    setUmurAji(hitungUmur);
    setTahunSekarang(hariIni.getFullYear());
  }, []);

  const handleAdminRedirect = () => {
    router.push("/admin");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        handleAdminRedirect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  useEffect(() => {
    const observers = slideRefs.map((ref, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSlide(index);
          }
        },
        { threshold: 0.5 }
      );

      if (ref.current) observer.observe(ref.current);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const scrollToSlide = (index: number) => {
    slideRefs[index].current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans text-zinc-50 overflow-hidden antialiased">
      
      {/* NAVIGASI TITIK-TITIK */}
      <div className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3">
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            aria-label={`Ke slide ${index + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              activeSlide === index 
                ? "bg-blue-500 scale-125 ring-4 ring-blue-500/20" 
                : "bg-zinc-700 hover:bg-zinc-500"
            }`}
          />
        ))}
      </div>

      {/* Konten Utama */}
      <main className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        
        {/* SLIDE 1: HEADER + IDENTITAS */}
        <section ref={slideRefs[0]} className="flex h-screen w-full snap-start snap-always flex-col">
          <Header />
          <div className="mx-auto h-[calc(100vh-5rem)] w-full max-w-2xl px-6">
            <HeroProfil umur={umurAji} onSecretClick={handleAdminRedirect} />
          </div>
        </section>
        
        {/* SLIDE 2: HISTORI */}
        <section ref={slideRefs[1]} className="flex h-screen w-full snap-start snap-always flex-col px-6">
          <div className="mx-auto h-full w-full max-w-2xl">
            <Histori />
          </div>
        </section>
        
        {/* SLIDE 3: KARYA TULIS */}
        <section ref={slideRefs[2]} className="flex h-screen w-full snap-start snap-always flex-col px-6">
          <div className="mx-auto h-full w-full max-w-5xl">
            <KaryaTulis />
          </div>
        </section>
        
        {/* SLIDE 4: KONTAK & FOOTER */}
        <section ref={slideRefs[3]} className="flex h-screen w-full snap-start snap-always flex-col px-6">
          <div className="mx-auto h-full w-full max-w-2xl">
            <PortfolioContact tahun={tahunSekarang} />
          </div>
        </section>
      </main>
    </div>
  );
}