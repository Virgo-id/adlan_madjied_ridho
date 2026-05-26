// app/blog/[slug]/ClientFeatures.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// 1. Komponen Tombol Kembali
export function NavigasiKembali() {
  const router = useRouter();
  return (
    <button 
      onClick={() => router.back()} 
      className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      Kembali
    </button>
  );
}

// 2. Komponen Pelacak Views (Aman dari Googlebot, khusus mendeteksi manusia asli)
export function TrackerViews({ postId }: { postId: string }) {
  useEffect(() => {
    async function increment() {
      const sessionKey = `viewed_${postId}`;
      const hasViewed = sessionStorage.getItem(sessionKey);

      if (!hasViewed) {
        await supabase.rpc("increment_views", { post_id: postId });
        sessionStorage.setItem(sessionKey, "true");
      }
    }
    increment();
  }, [postId]);

  // Komponen ini tidak merender apa pun ke layar layar
  return null;
}