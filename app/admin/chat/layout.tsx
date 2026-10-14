// src/app/admin/chat/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import ChatListSidebar from "./ChatListSidebar";

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
    <div className="w-full h-screen grid grid-cols-1 md:grid-cols-[350px_1fr] md:pl-16 overflow-hidden bg-zinc-950">
      {/* SISI KIRI: daftar obrolan (tetap terpasang, tidak re-render saat pindah chat) */}
      <div className={`w-full h-full overflow-hidden ${isInsideRoom ? "hidden md:block" : "block"}`}>
        <ChatListSidebar activeId={activeId} />
      </div>

      {/* SISI KANAN: halaman kosong atau ChatRoomContent */}
      <div className={`w-full h-full overflow-hidden ${!isInsideRoom ? "hidden md:block" : "block"}`}>
        {children}
      </div>
    </div>
  );
}