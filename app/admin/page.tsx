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
        // Kalau ga ada user aktif, langsung tendang ke /loginadmin
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
      
      // Jika berhasil logout, arahkan ke halaman login admin
      router.replace("/loginadmin");
    } catch (err) {
      console.error("Gagal melakukan logout:", err);
    }
  };

  // Jika sedang mengecek auth, berikan tampilan blank hitam/putih minimalis dulu
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
        <div className="text-sm font-medium text-zinc-400 animate-pulse">
          Memeriksa Autentikasi...
        </div>
      </div>
    );
  }

  // 4. TAMPILAN UTAMA (Hanya muncul jika sudah lolos login)
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      
      {/* TOMBOL LOGOUT HIJAU BULAT DI POJOK ATAS KANAN */}
      <div className="absolute right-6 top-6 z-50">
        <button
          onClick={handleLogout}
          aria-label="Logout"
          title="Keluar dari Admin"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-zinc-50 shadow-md transition-all hover:bg-emerald-700 hover:scale-[1.05] active:scale-[0.95] dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
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
      <div className="text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
          Sistem Dashboard Admin
        </p>
        <h1 className="text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 font-mono">
          {waktu || "00:00:00"}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Selamat datang kembali, Admin AMR.
        </p>
      </div>
    </div>
  );
}