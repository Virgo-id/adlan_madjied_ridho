"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.unregister())
        .catch((err) =>
          console.error("SW gagal dinonaktifkan saat development:", err)
        );
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("SW gagal didaftarkan:", err));
  }, []);

  return null;
}