"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    // Hanya di production, supaya saat dev tidak ada cache kode lama
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("SW gagal didaftarkan:", err));
  }, []);

  return null;
}