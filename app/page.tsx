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
  views: number | null;
  content: string | null;
  summary: string | null;
  author: string | null;
  bio: string | null;
  cover_url: string | null;
}

// ==========================================
// 1. KOMPONEN HEADER
// ==========================================
function Header() {
  return (
    <header className="w-full bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-black tracking-widest text-zinc-900 dark:text-zinc-50">
          AMR
        </Link>
        <Link 
          href="/customer/chat" 
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-zinc-50 transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
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
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-800 shadow-sm sm:h-32 sm:w-32">
          <Image
            src="/image/profil/profil.jpg"
            alt="Adlan Madjied Ridho"
            fill
            sizes="(max-width: 640px) 112px, 128px"
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Adlan Madjied Ridho
          </h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Santri Annuqayah yang mendalami pengembangan situs web dan karya tulis.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-900">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-4">
          Identitas Diri
        </h2>
        <ul className="grid grid-cols-1 gap-3 text-base text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
          <li>
            <span 
              onClick={onSecretClick} 
              className="font-semibold text-zinc-900 dark:text-zinc-100 cursor-default select-none transition-colors active:text-emerald-500"
              title="Identity"
            >
              Nama:
            </span>{" "}
            Adlan Madjied Ridho
          </li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Panggilan:</span> Aji</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Umur:</span> {umur} {typeof umur === "number" && "tahun"}</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Lahir:</span> 01 September 2007</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Zodiak:</span> Virgo</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Alamat:</span> Sukogidri, Ledokombo, Jember</li>
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
            Riwayat Jabatan
          </h2>
          <ul className="space-y-4 border-l-2 border-emerald-500 pl-4 dark:border-emerald-600">
            <li className="flex flex-col">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Basis Data & Inventaris</span>
              <span className="text-sm text-zinc-500">Perpustakaan Lubangsa</span>
            </li>
            <li className="flex flex-col">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Sekretaris</span>
              <span className="text-sm text-zinc-500">Perpustakaan Lubangsa</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
            Riwayat Pendidikan
          </h2>
          <div className="relative border-l-2 border-zinc-200 pl-4 dark:border-zinc-800 space-y-3">
            {["Universitas Annuqayah", "MA 1 Annuqayah", "MTs Nurul Mannan", "MI Nurul Mannan", "Taman Kanak-kanak"].map((edu, idx) => (
              <div key={idx} className="relative text-base text-zinc-600 dark:text-zinc-400">
                <div className={`absolute -left-[22px] top-2 h-2 w-2 rounded-full ring-4 ring-zinc-50 dark:ring-zinc-950 ${idx === 0 ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <span className={idx === 0 ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}>
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
// 4. KOMPONEN KARYA TULIS (MINIMALIS & TINGGI PENUH SLIDE)
// ==========================================
function KaryaTulis() {
  const [daftarKarya, setDaftarKarya] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("id, created_at, title, slug, category, status, views, content, summary, author, bio, cover_url")
          .eq("status", "Published") 
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setDaftarKarya(data);
      } catch (err) {
        console.error("Gagal memuat karya tulis:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="flex flex-col justify-between h-full py-12 gap-6">
      
      {/* JUDUL DIBUAT MINIMALIS */}
      <div className="shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
          Karya Tulis
        </h2>
      </div>

      {/* GRID KONTEN MENGISI AREA TENGAH HINGGA BAWAH */}
      <div className="grow grid gap-x-6 gap-y-8 grid-cols-1 sm:grid-cols-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
        {isLoading ? (
          /* SKELETON LOADING BOX LANCIP */
          [1, 2].map((n) => (
            <div key={n} className="flex flex-col gap-3 animate-pulse">
              <div className="w-full aspect-video bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-5/6 bg-zinc-300 dark:bg-zinc-700 mt-1" />
            </div>
          ))
        ) : daftarKarya.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-400">Belum ada karya tulis yang diterbitkan.</p>
          </div>
        ) : (
          daftarKarya.map((karya) => {
            return (
              <Link 
                key={karya.id}
                href={`/blog/${karya.slug || karya.id}`}
                className="flex flex-col gap-3 group block"
              >
                {/* SAMPUL KOTAK LANCIP PERFEK */}
                {karya.cover_url && (
                  <div className="relative w-full aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    <Image
                      src={karya.cover_url}
                      alt={`Sampul ${karya.title}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* AREA JUDUL SAJA (TANPA BORDER / BG CARD) */}
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                    {karya.title}
                  </h3>
                </div>
              </Link>
            );
          })
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
            Mari Terhubung
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Punya ide proyek web, diskusi karya tulis, atau sekadar ingin menyapa? Silakan kirim pesan melalui tombol chat di atas atau hubungi langsung via email.
          </p>
          <div className="flex gap-4 mt-2">
            <a 
              href="mailto:adlanmadjied@example.com"
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 decoration-emerald-500/50 dark:text-zinc-50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Email saya
            </a>
          </div>
        </div>
      </div>

      <footer className="w-full border-t border-zinc-200 pt-6 text-center dark:border-zinc-900">
        <p className="text-xs text-zinc-500 dark:text-zinc-600 tracking-wide">
          &copy; {tahun} AMR. Hak Cipta Dilindungi Undang-Undang.
        </p>
      </footer>
    </div>
  );
}

// ==========================================
// HALAMAN UTAMA (HOME)
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
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 overflow-hidden dark:bg-zinc-950 dark:text-zinc-50">
      
      {/* NAVIGASI TITIK-TITIK */}
      <div className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3">
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            aria-label={`Ke slide ${index + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              activeSlide === index 
                ? "bg-emerald-600 dark:bg-emerald-400 scale-125 ring-4 ring-emerald-600/10 dark:ring-emerald-400/20" 
                : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-500"
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
        <section ref={slideRefs[1]} className="flex h-screen w-full snap-start snap-always flex-col px-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto h-full w-full max-w-2xl">
            <Histori />
          </div>
        </section>
        
        {/* SLIDE 3: KARYA TULIS */}
        <section ref={slideRefs[2]} className="flex h-screen w-full snap-start snap-always flex-col px-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto h-full w-full max-w-2xl">
            <KaryaTulis />
          </div>
        </section>
        
        {/* SLIDE 4: KONTAK & FOOTER */}
        <section ref={slideRefs[3]} className="flex h-screen w-full snap-start snap-always flex-col px-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto h-full w-full max-w-2xl">
            <PortfolioContact tahun={tahunSekarang} />
          </div>
        </section>
      </main>
    </div>
  );
}