"use client";

import { useEffect, useState, type ClipboardEvent, type RefObject } from "react";
import { countWords, sanitizeHtml } from "./utils";

// Tailwind preflight mereset heading/list, jadi gaya isi dokumen ditulis di sini
const CONTENT =
  "[&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-300/60 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-blue-100/90 [&_hr]:my-4 [&_hr]:border-blue-400/30 [&_a]:text-cyan-300 [&_a]:underline";

export function RichEditor({
  initialHtml,
  editorRef,
  onChange,
  onWords,
}: {
  initialHtml: string;
  editorRef: RefObject<HTMLDivElement | null>;
  /** Dipanggil hanya saat user mengedit (bukan saat memuat isi awal) */
  onChange: (html: string) => void;
  onWords: (n: number) => void;
}) {
  const [empty, setEmpty] = useState(true);

  // Isi awal dipasang sekali; setelah itu editor dikendalikan browser
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {}
    el.innerHTML = sanitizeHtml(initialHtml) || "<p><br></p>";
    const w = countWords(el.innerText);
    setEmpty(w === 0);
    onWords(w);
    if (w === 0) el.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const w = countWords(el.innerText);
    setEmpty(w === 0);
    onWords(w);
    onChange(el.innerHTML);
  };

  // Tempel sebagai teks polos agar format dari Word/web tidak ikut berantakan
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className="relative">
      {empty && (
        <span className="pointer-events-none absolute left-0 top-2 select-none text-blue-200/40">
          Mulai menulis di sini…
        </span>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Isi dokumen"
        spellCheck
        lang="id"
        onInput={handleInput}
        onPaste={handlePaste}
        className={`min-h-[60vh] outline-none ${CONTENT}`}
      />
    </div>
  );
}