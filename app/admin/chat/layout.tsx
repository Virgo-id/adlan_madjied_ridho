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
  
  // Ambil ID secara langsung dari URL jika rutenya adalah /admin/chat/[id]
  const segments = pathname.split("/");
  // Jika rute berakhir di '/chat', berarti tidak ada user yang aktif
  const activeId = segments[segments.length - 1] !== "chat" ? segments[segments.length - 1] : undefined;

  // Sembunyikan daftar orang di HP jika admin sudah masuk ke dalam ruang chat khusus
  const isInsideRoom = !!activeId;

  return (
    <div className="w-full h-screen grid grid-cols-1 md:grid-cols-[350px_1fr] md:pl-16 overflow-hidden bg-black">
      
      {/* SISI KIRI: Daftar Orang (Sidebar Chat)
          Akan terkunci di sini dan TIDAK AKAN PERNAH RE-RENDER/BERKEDIP saat pindah chat */}
      <div className={`w-full h-full overflow-hidden ${isInsideRoom ? "hidden md:block" : "block"}`}>
        <ChatListSidebar activeId={activeId} />
      </div>

      {/* SISI KANAN: Konten Dinamis (Bisa berupa halaman kosong atau ChatRoomContent) */}
      <div className={`w-full h-full overflow-hidden ${!isInsideRoom ? "hidden md:block" : "block"}`}>
        {children}
      </div>

    </div>
  );
}