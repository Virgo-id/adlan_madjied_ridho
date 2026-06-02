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
          className="text-xs font-semibold text-zinc-500 flex items-center gap-1 hover:text-blue-500 transition-colors"
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
        {/* AKSEN BIRU SOLID */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 block mb-2">
          Ruang Obrolan
        </span>
        
        {/* JUDUL UNIVERSAL */}
        <h1 className="text-zinc-50 font-black text-3xl tracking-tight mb-2">
          Mari Bicara
        </h1>
        
        {/* DESKRIPSI */}
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Masuk dengan Google untuk memulai obrolan langsung dengan Saya.
        </p>
        
        {/* TOMBOL LOGIN BIRU SOLID */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99]"
        >
          Login dengan Google
        </button>
      </div>
    </div>
  );
}