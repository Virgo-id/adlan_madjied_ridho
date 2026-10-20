"use client";

import { useEffect, useState } from "react";
import { aktifkanNotifikasi } from "@/lib/push";

type Status = "menyiapkan" | "idle" | "memuat" | "aktif" | "ditolak" | "tidak-didukung";

function detailError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function langkahError(error: unknown) {
  if (error && typeof error === "object" && "langkah" in error) {
    return String(error.langkah);
  }
  return "aktivasi notifikasi";
}

function izinNotifikasiDitolak() {
  return "Notification" in window && Notification.permission === "denied";
}

export default function TombolNotifikasi({
  teks = "Aktifkan notifikasi agar tahu saat Adlan membalas",
}: {
  teks?: string;
}) {
  const [status, setStatus] = useState<Status>("menyiapkan");
  const [pesanError, setPesanError] = useState("");

  useEffect(() => {
    let dibatalkan = false;
    const siapkan = async () => {
      await Promise.resolve();
      if (dibatalkan) return;

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
        setStatus("memuat");
        try {
          await aktifkanNotifikasi();
          if (!dibatalkan) setStatus("aktif");
        } catch (error: unknown) {
          console.error(
            `[TombolNotifikasi] Langkah "${langkahError(error)}" gagal`,
            error,
          );
          if (dibatalkan) return;
          setPesanError(`Gagal mengaktifkan: ${detailError(error)}. Coba lagi.`);
          setStatus(izinNotifikasiDitolak() ? "ditolak" : "idle");
        }
        return;
      }
      setStatus("idle");
    };
    void siapkan();
    return () => {
      dibatalkan = true;
    };
  }, []);

  if (status === "menyiapkan" || status === "aktif") return null;

  const pesanStatus =
    status === "ditolak"
        ? "Izin notifikasi belum diizinkan. Aktifkan izin situs ini melalui pengaturan browser."
      : status === "tidak-didukung"
        ? "Browser ini tidak mendukung notifikasi push."
        : "";

  return (
    <div className="shrink-0 border-t border-blue-400/15 bg-blue-500/10 px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] leading-snug text-blue-100/80">
          {pesanStatus || teks}
        </p>
        {(status === "idle" || status === "memuat") && (
          <button
            type="button"
            disabled={status === "memuat"}
            onClick={async () => {
              setStatus("memuat");
              setPesanError("");
              let statusAkhir: Status = "idle";
              try {
                await aktifkanNotifikasi();
                statusAkhir = "aktif";
              } catch (error: unknown) {
                const detail = detailError(error);
                console.error(
                  `[TombolNotifikasi] Langkah "${langkahError(error)}" gagal`,
                  error,
                );
                statusAkhir =
                  izinNotifikasiDitolak() || langkahError(error) === "izin notifikasi"
                    ? "ditolak"
                    : "idle";
                setPesanError(
                  statusAkhir === "ditolak"
                    ? ""
                    : `Gagal mengaktifkan: ${detail}. Coba lagi.`,
                );
              } finally {
                setStatus(statusAkhir);
              }
            }}
            className="shrink-0 cursor-pointer rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:from-blue-500 hover:to-cyan-400 active:scale-95 disabled:opacity-60"
          >
            {status === "memuat" ? "Mengaktifkan..." : "Aktifkan"}
          </button>
        )}
      </div>
      {pesanError && status !== "ditolak" && (
        <p role="status" className="mt-1 text-[11px] leading-snug text-red-200">
          {pesanError}
        </p>
      )}
    </div>
  );
}