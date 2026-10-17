"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";

// Lebar sidebar desktop saat ciut (harus sama dengan w-[4.5rem] di Sidebar)
const LEBAR_SIDEBAR = "md:left-[4.5rem]";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Menyembunyikan tombol menu mobile HANYA jika masuk ke rute detail chat /admin/chat/[id]
  // Rute induk /admin/chat (daftar orang) tetap menampilkan tombol menu.
  const isInsideChatRoom =
    pathname.startsWith("/admin/chat/") && pathname !== "/admin/chat";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#040a16] font-sans text-zinc-50 antialiased selection:bg-cyan-400/25">
      {/* BACKGROUND GAMBAR
          Di desktop dimulai setelah sidebar (left-[4.5rem]) sehingga tidak tertimpa.
          Posisi gambar: di mobile (layar sempit, gambar terpotong) yang terlihat bagian KIRI,
          di desktop tetap di tengah. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 bg-cover bg-left bg-no-repeat md:bg-center ${LEBAR_SIDEBAR}`}
        style={{ backgroundImage: "url('/image/bg/bg.png')" }}
      />

      {/* Lapisan gelap agar teks tetap terbaca di atas gambar */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-[#040a16]/70 via-[#040a16]/60 to-[#040a16]/85 ${LEBAR_SIDEBAR}`}
      />

      {/* Glow biru global */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[25%] top-[-10%] z-0 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[130px]"
      />

      {/* STRUKTUR UTAMA WORKSPACE */}
      <div className="flex min-h-screen w-full flex-col">
        <Sidebar hideMobile={isInsideChatRoom} />

        {/* Area konten: digeser di desktop agar tidak masuk ke bawah sidebar */}
        <div className="relative z-10 w-full flex-1 md:pl-[4.5rem]">
          {children}
        </div>
      </div>
    </div>
  );
}