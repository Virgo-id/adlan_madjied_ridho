"use client";

import { useEffect } from "react";
import { Post } from "../page";

export default function PostView({ post, onClose }: { post: Post, onClose: () => void }) {
  // Tutup dengan Escape
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", tekan);
    return () => document.removeEventListener("keydown", tekan);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
      className="scrollbar-biru fixed inset-0 z-50 overflow-y-auto bg-[#040a16] p-6 [background-image:radial-gradient(rgba(96,165,250,0.12)_1px,transparent_1px)] [background-size:24px_24px] md:p-12"
    >
      {/* Tombol tutup yang menempel di atas saat di-scroll */}
      <div className="sticky top-0 z-10 mb-8 flex w-full justify-end">
        <button
          onClick={onClose}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-blue-400/30 bg-blue-950/80 px-5 py-2.5 text-xs font-semibold text-blue-100 transition duration-200 hover:border-cyan-300/60 hover:text-cyan-200 active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          Tutup
        </button>
      </div>

      <article className="mx-auto max-w-3xl pb-20">
        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_url}
            className="mb-8 h-80 w-full rounded-[2rem] border border-blue-400/20 object-cover"
            alt={post.title}
          />
        )}

        <h1 className="mb-4 text-4xl font-black leading-tight text-white">{post.title}</h1>

        <div className="mb-8 flex items-center gap-3">
          {post.category && (
            <span className="rounded-full bg-linear-to-r from-blue-600 to-cyan-500 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white">
              {post.category}
            </span>
          )}
          {post.status && (
            <span className="rounded-full border border-blue-400/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-blue-200">
              {post.status}
            </span>
          )}
        </div>

        <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-blue-50/90">
          {post.content}
        </div>
      </article>
    </div>
  );
}