"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function CustomerLogin() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/customer/chat`,
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 select-none">
      
      {/* TOMBOL KEMBALI DI POJOK KIRI ATAS */}
      <div className="absolute left-6 top-8 sm:left-12 sm:top-12">
        <Link 
          href="/" 
          className="text-xs font-semibold text-zinc-500 flex items-center gap-1 hover:text-emerald-500 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali
        </Link>
      </div>

      <div className="w-full max-w-sm text-center">
        {/* AKSEN HIJAU */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 block mb-2">
          Ruang Obrolan
        </span>
        
        {/* JUDUL UNIVERSAL (TIDAK ADA KATA LUBANGSA) */}
        <h1 className="text-zinc-50 font-black text-3xl tracking-tight mb-2">
          Mari Bicara
        </h1>
        
        {/* DESKRIPSI UNTUK SIAPA SAJA */}
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Masuk dengan Google untuk memulai obrolan langsung dengan Saya.
        </p>
        
        {/* TOMBOL LOGIN */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-emerald-600 text-zinc-50 px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
        >
          Login dengan Google
        </button>
      </div>
    </div>
  );
}