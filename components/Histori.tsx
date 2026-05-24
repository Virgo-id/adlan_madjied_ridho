"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Import komponen mandiri dari folder components
import HeroProfil from "@/components/HeroProfil";
import Histori from "@/components/Histori";
import PortfolioContact from "@/components/PortfolioContact";

// ==========================================
// 1. KOMPONEN HEADER (Brand AMR)
// ==========================================
function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlHeader = () => {
      if (typeof window !== "undefined") {
        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };
    window.addEventListener("scroll", controlHeader);
    return () => window.removeEventListener("scroll", controlHeader);
  }, [lastScrollY]);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-zinc-50/80 backdrop-blur transition-transform duration-300 dark:bg-zinc-950/80 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
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
// Halaman Utama (Home)
// ==========================================
export default function Home() {
  // Hitung Umur Otomatis
  const hariIni = new Date();
  const tanggalLahir = new Date("2007-09-01");
  let umurAji = hariIni.getFullYear() - tanggalLahir.getFullYear();
  const bulan = hariIni.getMonth() - tanggalLahir.getMonth();
  if (bulan < 0 || (bulan === 0 && hariIni.getDate() < tanggalLahir.getDate())) {
    umurAji--;
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 font-sans text-zinc-900 overflow-hidden dark:bg-zinc-950 dark:text-zinc-50">
      <Header />
      
      <main className="h-[calc(100vh-5rem)] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth">
        {/* SLIDE 1: IDENTITAS */}
        <section className="flex h-[calc(100vh-5rem)] w-full snap-start snap-always flex-col px-6">
          <div className="mx-auto h-full w-full max-w-2xl">
            <HeroProfil umur={umurAji} />
          </div>
        </section>
        
        {/* SLIDE 2: HISTORI */}
        <section className="flex h-[calc(100vh-5rem)] w-full snap-start snap-always flex flex-col px-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto h-full w-full max-w-2xl">
            <Histori />
          </div>
        </section>
        
        {/* SLIDE 3: KONTAK & FOOTER */}
        <section className="flex h-[calc(100vh-5rem)] w-full snap-start snap-always flex flex-col px-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto h-full w-full max-w-2xl">
            <PortfolioContact />
          </div>
        </section>
      </main>
    </div>
  );
}