"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Import untuk navigasi halaman

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
          href="/chat" 
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-zinc-50 transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Chat with me
        </Link>
      </div>
    </header>
  );
}

// ==========================================
// 2. KOMPONEN HERO PROFIL
// ==========================================
function HeroProfil({ umur }: { umur: number }) {
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
            Santri Annuqayah yang tertarik pada pengembangan website and karya tulis.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-900">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
          Identitas Diri
        </h2>
        <ul className="grid grid-cols-1 gap-3 text-base text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Nama:</span> adlan madjied ridho</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Panggilan:</span> aji</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Umur:</span> {umur} tahun</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Lahir:</span> 01 September 2007</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Zodiak:</span> Virgo</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Alamat:</span> Sukogidrih, Ledokombo, Jember</li>
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Histori Jabatan
          </h2>
          <ul className="space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Histori Pendidikan
          </h2>
          <div className="relative border-l-2 border-zinc-200 pl-4 dark:border-zinc-800 space-y-3">
            {["Universitas Annuqayah", "MA 1 Annuqayah", "MTs Nurul Mannan", "MI Nurul Mannan", "TK"].map((edu, idx) => (
              <div key={idx} className="relative text-base text-zinc-600 dark:text-zinc-400">
                <div className="absolute -left-[22px] top-2 h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700 ring-4 ring-zinc-50 dark:ring-zinc-950" />
                <span className={idx === 0 ? "font-bold text-zinc-900 dark:text-zinc-100" : ""}>
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
// 4. KOMPONEN PORTFOLIO & CONTACT
// ==========================================
function PortfolioContact() {
  const tahunSekarang = new Date().getFullYear();

  return (
    <div className="flex flex-col justify-between h-full py-4">
      <div className="my-auto space-y-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Mari Terhubung
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Punya ide proyek web, diskusi karya tulis, atau sekadar ingin menyapa? Silakan kirim pesan melalui tombol chat di atas atau hubungi langsung via email.
          </p>
          <div className="flex gap-4 mt-2">
            <a 
              href="mailto:adlanmadjied@example.com"
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Email saya
            </a>
          </div>
        </div>
      </div>

      <footer className="w-full border-t border-zinc-200 pt-6 text-center dark:border-zinc-900">
        <p className="text-xs text-zinc-500 dark:text-zinc-600 tracking-wide">
          &copy; {tahunSekarang} AMR. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// ==========================================
// Halaman Utama (Home)
// ==========================================
export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideRefs = [useRef<HTMLElement>(null), useRef<HTMLElement>(null), useRef<HTMLElement>(null)];
  const router = useRouter(); // Instance router Next.js

  // Hitung Umur Otomatis
  const hariIni = new Date();
  const tanggalLahir = new Date("2007-09-01");
  let umurAji = hariIni.getFullYear() - tanggalLahir.getFullYear();
  const bulan = hariIni.getMonth() - tanggalLahir.getMonth();
  if (bulan < 0 || (bulan === 0 && hariIni.getDate() < tanggalLahir.getDate())) {
    umurAji--;
  }

  // FITUR: Shortcut Alt + L ke halaman Admin
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Deteksi jika tombol Alt + l (atau L) ditekan bersamaan
      if (event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault(); // Mencegah fungsi bawaan browser jika ada
        router.push("/admin"); // Lompat ke halaman admin
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  // Deteksi Slide Aktif Saat Di-scroll
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

  // Fungsi Lompat ke Slide Tertentu
  const scrollToSlide = (index: number) => {
    slideRefs[index].current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 overflow-hidden dark:bg-zinc-950 dark:text-zinc-50">
      
      {/* NAVIGASI TITIK-TITIK */}
      <div className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            aria-label={`Ke slide ${index + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              activeSlide === index 
                ? "bg-zinc-900 dark:bg-zinc-50 scale-125 ring-4 ring-zinc-900/10 dark:ring-zinc-50/20" 
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
            <HeroProfil umur={umurAji} />
          </div>
        </section>
        
        {/* SLIDE 2: HISTORI */}
        <section ref={slideRefs[1]} className="flex h-screen w-full snap-start snap-always flex flex-col px-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto h-full w-full max-w-2xl">
            <Histori />
          </div>
        </section>
        
        {/* SLIDE 3: KONTAK & FOOTER */}
        <section ref={slideRefs[2]} className="flex h-screen w-full snap-start snap-always flex flex-col px-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto h-full w-full max-w-2xl">
            <PortfolioContact />
          </div>
        </section>
      </main>
    </div>
  );
}