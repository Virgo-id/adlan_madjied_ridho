"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EditorBar } from "../components/EditorBar";
import { EditorToolbar } from "../components/EditorToolbar";
import { RichEditor } from "../components/RichEditor";
import { useDocument } from "../components/useDocument";
import { BTN, PANEL, formatDate } from "../components/utils";

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const d = useDocument(id);
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [words, setWords] = useState(0);

  useEffect(() => {
    if (d.doc) setTitle(d.doc.title);
  }, [d.doc]);

  // Ctrl+S menyimpan sekarang juga
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void d.flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d]);

  if (d.state === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center font-sans">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-blue-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Memuat dokumen…
        </div>
      </div>
    );
  }

  if (d.state === "missing" || !d.doc) {
    return (
      <div className="flex h-dvh items-center justify-center px-4 font-sans">
        <div className={`${PANEL} flex max-w-sm flex-col items-center gap-3 p-6 text-center`}>
          <p className="text-sm text-blue-100">
            Dokumen tidak ditemukan. Mungkin sudah dihapus atau tautannya salah.
          </p>
          <Link href="/admin/document" className={BTN}>
            Kembali ke Dokumen
          </Link>
        </div>
      </div>
    );
  }

  const backHref = d.doc.parentId
    ? `/admin/document?folder=${d.doc.parentId}`
    : "/admin/document";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden px-4 pb-28 pt-4 font-sans text-zinc-50 antialiased md:pb-4">
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-3">
        <EditorBar
          backHref={backHref}
          title={title}
          onTitle={(v) => {
            setTitle(v);
            d.setTitle(v);
          }}
          save={d.save}
          onSave={() => void d.flush()}
        />

        <EditorToolbar targetRef={editorRef} />

        <div
          className={`${PANEL} scrollbar-biru min-h-0 flex-1 overflow-y-auto`}
          onClick={(e) => {
            if (e.target === e.currentTarget) editorRef.current?.focus();
          }}
        >
          <div className="mx-auto max-w-3xl px-5 py-6 text-base leading-7 text-blue-50 md:px-8">
            <RichEditor
              initialHtml={d.doc.content}
              editorRef={editorRef}
              onChange={d.setContent}
              onWords={setWords}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-blue-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          <span>{words.toLocaleString("id-ID")} kata</span>
          {d.savedAt && <span>Terakhir disimpan {formatDate(d.savedAt)}</span>}
          <span className="sm:hidden">{d.save === "error" ? "Gagal menyimpan" : ""}</span>
        </div>
      </div>
    </div>
  );
}