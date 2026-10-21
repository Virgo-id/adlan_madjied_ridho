"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";

export function DropZone({
  onFiles,
  label,
  children,
}: {
  onFiles: (files: File[]) => void;
  label: string;
  children: ReactNode;
}) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes("Files");

  return (
    <div
      className="relative h-full min-h-0"
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300 bg-blue-950/80 p-4 text-center text-sm font-semibold text-cyan-100 shadow-[0_0_24px_rgba(56,189,248,0.4)]">
          Lepas file untuk mengunggah ke {label}
        </div>
      )}
    </div>
  );
}