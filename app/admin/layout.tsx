"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Menyembunyikan bottom navbar HANYA jika masuk ke rute detail chat internal /admin/chat/[id]
  // Contoh rute detail: /admin/chat/123-abc-456
  // Sedangkan rute induk /admin/chat (daftar orang) tetap menampilkan bottom navbar dengan aman.
  const isInsideChatRoom = pathname.startsWith("/admin/chat/") && pathname !== "/admin/chat";

  return (
    // PERBAIKAN: bg-zinc-50 (putih) dihapus dan diganti bg-black murni agar serasi dengan halaman chat Anda yang bernuansa gelap
    <div className="relative min-h-screen bg-black text-zinc-300 font-sans antialiased overflow-x-hidden selection:bg-emerald-500/20">
      
      {/* BACKGROUND GLOW GLOBAL */}
      <div className="absolute top-[-10%] left-[25%] h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none" />

      {/* STRUKTUR UTAMA WORKSPACE */}
      <div className="w-full min-h-screen flex flex-col">
        {/* Kirim properti hideMobile ke komponen Sidebar */}
        <Sidebar hideMobile={isInsideChatRoom} />

        {/* Area dinamis tempat page/halaman dimasukkan */}
        <div className="flex-1 w-full relative z-10">
          {children}
        </div>
      </div>

    </div>
  );
}