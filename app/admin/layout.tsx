// src/app/admin/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";

// Lebar sidebar desktop saat ciut (harus sama dengan w-[4.5rem] di Sidebar)
const LEBAR_SIDEBAR = "md:left-[4.5rem]";

// Satu layer saja: gradasi gelap (agar teks terbaca) + gambar latar digabung dalam satu background-image.
// Sebelumnya dua layer fixed layar penuh yang bertumpuk, jadi browser meng-composite dua kali.
const LATAR =
  "linear-gradient(to bottom, rgba(4,10,22,0.70), rgba(4,10,22,0.60), rgba(4,10,22,0.85)), " +
  "url('/image/bg/bg.png')";

// Pengganti glow blur-[130px]: radial-gradient statis, tanpa filter blur (jauh lebih ringan di GPU lemah)
const GLOW = "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0) 70%)";

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
      {/* BACKGROUND (gambar + lapisan gelap dalam satu layer).
          Di desktop dimulai setelah sidebar (left-[4.5rem]) sehingga tidak tertimpa.
          Posisi gambar: di mobile yang terlihat bagian KIRI, di desktop tetap di tengah. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 bg-cover bg-left bg-no-repeat md:bg-center ${LEBAR_SIDEBAR}`}
        style={{ backgroundImage: LATAR }}
      />

      {/* Glow biru global (tanpa blur) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[25%] top-[-10%] z-0 h-[600px] w-[600px]"
        style={{ backgroundImage: GLOW }}
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