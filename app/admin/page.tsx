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

  // 3. TAMPILAN UTAMA (Hanya muncul jika sudah lolos login)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
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