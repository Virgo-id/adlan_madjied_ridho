// src/app/admin/chat/page.tsx
"use client";

export default function AdminChatPage() {
  return (
    // Hanya menampilkan teks kosong di sisi kanan (desktop) ketika admin belum memilih satu pun chat.
    // Elemen ini otomatis mengisi bagian {children} pada layout.tsx Anda.
    <div className="h-full w-full flex items-center justify-center bg-zinc-950 text-zinc-600 text-xs font-medium">
      Pilih salah satu obrolan untuk mulai membalas pesan.
    </div>
  );
}