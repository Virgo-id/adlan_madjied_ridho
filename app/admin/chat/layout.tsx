// src/app/admin/chat/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import ChatListSidebar from "./ChatListSidebar";

// Gaya panel: tembus pandang penuh (tanpa warna latar dan tanpa blur),
// hanya berupa bingkai. Di desktop bersudut lengkung dengan border biru tipis.
const PANEL =
  "relative h-full w-full overflow-hidden " +
  "md:rounded-2xl md:border md:border-blue-400/30";

export default function AdminChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Ambil ID langsung dari URL jika rutenya /admin/chat/[id]
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const activeId = last && last !== "chat" ? last : undefined;

  // Di HP, sembunyikan daftar orang jika admin sudah masuk ke ruang chat
  const isInsideRoom = !!activeId;

  return (
    // Offset sidebar (md:pl-[4.5rem]) sudah diberikan oleh layout admin,
    // jadi di sini cukup padding tipis + jarak tipis antar panel (gap-2).
    <div className="grid h-screen w-full grid-cols-1 overflow-hidden md:grid-cols-[350px_1fr] md:gap-2 md:p-2">
      {/* PANEL KIRI: daftar obrolan (tetap terpasang, tidak re-render saat pindah chat) */}
      <div className={`${PANEL} ${isInsideRoom ? "hidden md:block" : "block"}`}>
        <ChatListSidebar activeId={activeId} />
      </div>

      {/* PANEL KANAN: halaman kosong atau ChatRoomContent */}
      <div className={`${PANEL} ${!isInsideRoom ? "hidden md:block" : "block"}`}>
        {children}
      </div>
    </div>
  );
}