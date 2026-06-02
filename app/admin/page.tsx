"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [waktu, setWaktu] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // 1. ENGINE VALIDASI: Tendang user kalau ga login
  useEffect(() => {
    const cekUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace("/loginadmin");
      } else {
        setLoading(false);
      }
    };

    cekUser();
  }, [router]);

  // 2. ENGINE JAM DIGITAL: Update waktu setiap detik
  useEffect(() => {
    setWaktu(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    
    const interval = setInterval(() => {
      setWaktu(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 3. FUNGSI LOGOUT
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.replace("/loginadmin");
    } catch (err) {
      console.error("Gagal melakukan logout:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-sans">
        <div className="text-xs font-medium tracking-widest uppercase text-zinc-600 animate-pulse">
          Memeriksa Autentikasi...
        </div>
      </div>
    );
  }

  // 4. TAMPILAN UTAMA (Warna diselaraskan ke Blue Solid & Dark Seamless)
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 font-sans text-zinc-50 antialiased">
      
      {/* TOMBOL LOGOUT BIRU BULAT DI POJOK ATAS KANAN */}
      <div className="absolute right-6 top-6 z-50">
        <button
          onClick={handleLogout}
          aria-label="Logout"
          title="Keluar dari Admin"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-500 hover:scale-[1.05] active:scale-[0.95] shadow-[0_0_20px_rgba(37,99,235,0.15)]"
        >
          {/* Ikon Keluar / Log Out */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2.5} 
            stroke="currentColor" 
            className="h-5 w-5"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" 
            />
          </svg>
        </button>
      </div>

      {/* Konten Tengah */}
      <div className="text-center space-y-3 select-none">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
          Sistem Dashboard Admin
        </p>
        <h1 className="text-6xl font-black tracking-tighter text-white font-mono">
          {waktu || "00:00:00"}
        </h1>
        <p className="text-sm text-zinc-500">
          Selamat datang kembali, Admin AMR.
        </p>
      </div>
    </div>
  );
}