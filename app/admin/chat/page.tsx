// src/app/admin/chat/page.tsx
"use client";

/* Dekorasi cincin, sama seperti di halaman utama */
function Cincin({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    >
      <circle cx="100" cy="100" r="30" />
      <circle cx="100" cy="100" r="60" />
      <circle cx="100" cy="100" r="90" />
    </svg>
  );
}

export default function AdminChatPage() {
  return (
    // Tampil di panel kanan (desktop) saat admin belum memilih obrolan.
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden text-blue-200">
      <Cincin className="absolute -right-16 -top-16 h-64 w-64 text-blue-400/10" />
      <Cincin className="absolute -bottom-20 -left-20 h-56 w-56 text-cyan-300/10" />

      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-400 text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-7 w-7"
        >
          <path d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </span>
      <p className="relative px-6 text-center text-xs font-semibold text-blue-200/80">
        Pilih salah satu obrolan untuk mulai membalas pesan.
      </p>
    </div>
  );
}