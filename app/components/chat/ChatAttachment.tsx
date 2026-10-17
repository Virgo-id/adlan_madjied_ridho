"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_ATTACHMENT_BUCKET } from "@/lib/chat-attachments";
import { supabase } from "@/lib/supabase";

function Icon({
  path,
  className = "h-5 w-5",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export default function ChatAttachment({
  path,
  name,
  type,
  onDelete,
}: {
  path: string;
  name: string;
  type: string | null;
  onDelete?: () => Promise<boolean>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const createUrl = async () => {
      const { data, error } = await supabase.storage
        .from(CHAT_ATTACHMENT_BUCKET)
        .createSignedUrl(path, 60 * 60);

      if (cancelled) return;
      if (error) {
        console.error("Gagal membuka lampiran chat:", error);
        setFailed(true);
        return;
      }

      setUrl(data.signedUrl);
    };

    void createUrl();
    return () => {
      cancelled = true;
    };
  }, [path]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const openPreview = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsOpen(true);
  };

  const changeZoom = (delta: number) => {
    setScale((current) => Math.min(8, Math.max(0.25, current + delta)));
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!type?.startsWith("image/")) return;
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.15 : -0.15);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!type?.startsWith("image/") || scale <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPosition({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  if (failed) {
    return <p className="mt-2 text-xs text-red-300">Lampiran tidak dapat dibuka.</p>;
  }

  if (!url) {
    return <p className="mt-2 text-xs text-blue-200/60">Memuat lampiran...</p>;
  }

  const isImage = type?.startsWith("image/") ?? false;
  const isVideo = type?.startsWith("video/") ?? false;
  const isAudio = type?.startsWith("audio/") ?? false;
  return (
    <>
      <button
        type="button"
        onClick={openPreview}
        className="mt-2 block max-w-full cursor-zoom-in text-left"
        aria-label={`Buka pratinjau ${name}`}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name}
            loading="lazy"
            className="max-h-72 max-w-full rounded-xl object-contain"
          />
        ) : (
          <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-blue-300/20 bg-black/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-blue-500/20">
            <Icon path="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" className="h-4 w-4 shrink-0" />
            <span className="truncate">{name}</span>
            <span className="shrink-0 text-blue-200/60">Pratinjau</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-[#080b12]/[.97] text-white"
          role="dialog"
          aria-modal="true"
          aria-label={`Pratinjau ${name}`}
        >
          <header className="z-10 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-2 sm:px-6">
            <p className="min-w-0 truncate text-sm font-medium text-white/90">{name}</p>
            <div className="flex shrink-0 items-center gap-2">
              {isImage && (
                <>
                  <button
                    type="button"
                    onClick={() => changeZoom(-0.25)}
                    aria-label="Perkecil"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xl hover:bg-white/20"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScale(1);
                      setPosition({ x: 0, y: 0 });
                    }}
                    title="Atur ulang zoom"
                    className="min-w-14 rounded-lg px-2 py-2 text-xs tabular-nums text-white/80 hover:bg-white/10"
                  >
                    {Math.round(scale * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => changeZoom(0.25)}
                    aria-label="Perbesar"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xl hover:bg-white/20"
                  >
                    +
                  </button>
                </>
              )}
              <a
                href={url}
                download={name}
                className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold hover:bg-blue-500"
              >
                <Icon path="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" className="h-4 w-4" />
                <span className="hidden sm:inline">Unduh</span>
              </a>
              {onDelete && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      if (await onDelete()) setIsOpen(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="flex h-9 items-center gap-2 rounded-lg bg-red-600/90 px-3 text-xs font-semibold hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
                >
                  <Icon path="M3 6h18M8 6V4h8v2m3 0-.9 14H5L4 6m5 4v6m6-6v6" className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isDeleting ? "Menghapus..." : "Hapus"}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup pratinjau"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/80"
              >
                <Icon path="M18 6 6 18M6 6l12 12" />
              </button>
            </div>
          </header>

          <main
            className={`relative flex min-h-0 flex-1 items-center justify-center overflow-hidden ${
              isImage && scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
            }`}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={() => {
              if (!isImage) return;
              setScale((current) => (current === 1 ? 2 : 1));
              setPosition({ x: 0, y: 0 });
            }}
          >
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={name}
                draggable={false}
                className="max-h-full max-w-full select-none object-contain"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: "center",
                }}
              />
            ) : isVideo ? (
              <video src={url} controls autoPlay className="max-h-full max-w-full" />
            ) : isAudio ? (
              <audio src={url} controls autoPlay className="w-[min(90vw,40rem)]" />
            ) : (
              <iframe
                src={url}
                title={`Pratinjau ${name}`}
                className="h-full w-full border-0 bg-white"
              />
            )}
          </main>

          {isImage && (
            <p className="shrink-0 px-4 py-2 text-center text-[11px] text-white/50">
              Scroll untuk zoom · Klik dan geser untuk memindahkan · Klik dua kali untuk reset
            </p>
          )}
        </div>
      )}
    </>
  );
}
