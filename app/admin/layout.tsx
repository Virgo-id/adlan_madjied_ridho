"use client";

import Sidebar from "./components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased overflow-x-hidden selection:bg-emerald-500/20">
      
      {/* BACKGROUND GLOW GLOBAL */}
      <div className="absolute top-[-10%] left-[25%] h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none dark:bg-emerald-500/[0.02]" />

      {/* STRUKTUR UTAMA WORKSPACE */}
      <div className="w-full">
        {/* Sidebar menetap di sini, tidak hancur saat pindah page */}
        <Sidebar />

        {/* Area dinamis tempat page/halaman dimasukkan */}
        {children}
      </div>
    </div>
  );
}