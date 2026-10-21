"use client";

import { useEffect } from "react";
import type { Notice } from "./types";

export function Toast({
  notice,
  onDone,
}: {
  notice: Notice | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(onDone, notice.type === "err" ? 7000 : 3500);
    return () => clearTimeout(t);
  }, [notice, onDone]);

  if (!notice) return null;
  const err = notice.type === "err";

  return (
    <div
      role={err ? "alert" : "status"}
      className={`fixed bottom-24 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm font-medium md:bottom-6 ${
        err
          ? "border-rose-400/50 bg-rose-950/80 text-rose-100"
          : "border-cyan-300/40 bg-blue-950/80 text-cyan-100"
      }`}
    >
      {notice.text}
    </div>
  );
}