"use client";

import { useEffect, useState } from "react";
import { aktifkanNotifikasi } from "@/lib/push";

type Status = "menyiapkan" | "idle" | "memuat" | "aktif" | "ditolak" | "tidak-didukung";

export default function TombolNotifikasi({
  teks = "Aktifkan notifikasi agar tahu saat Adlan membalas",
}: {
  teks?: string;
}) {
  const [status, setStatus] = useState<Status>("menyiapkan");

  useEffect(() => {
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setStatus("tidak-didukung");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("ditolak");
      return;
    }
    if (Notification.permission === "granted") {
      // Sinkronkan subscription ke database tanpa memunculkan prompt
      aktifkanNotifikasi()
        .then(() => setStatus("aktif"))
        .catch(() => setStatus("idle"));
      return;
    }
    setStatus("idle");
  }, []);

  if (status !== "idle" && status !== "memuat") return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-blue-400/15 bg-blue-500/10 px-4 py-2">
      <p className="text-[11px] leading-snug text-blue-100/80">{teks}</p>
      <button
        type="button"
        disabled={status === "memuat"}
        onClick={async () => {
          setStatus("memuat");
          try {
            await aktifkanNotifikasi();
            setStatus("aktif");
          } catch {
            setStatus(Notification.permission === "denied" ? "ditolak" : "idle");
          }
        }}
        className="shrink-0 cursor-pointer rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:from-blue-500 hover:to-cyan-400 active:scale-95 disabled:opacity-60"
      >
        {status === "memuat" ? "Mengaktifkan..." : "Aktifkan"}
      </button>
    </div>
  );
}