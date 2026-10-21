"use client";

import { useCallback, useEffect, useState, type ReactNode, type RefObject } from "react";
import { Icon } from "./Icon";
import { PANEL } from "./utils";

type State = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  left: boolean;
  center: boolean;
  block: string;
};

const INIT: State = {
  bold: false, italic: false, underline: false, strike: false,
  ul: false, ol: false, left: true, center: false, block: "p",
};

const normBlock = (v: string) => {
  const s = v.toLowerCase();
  if (/h1|heading 1/.test(s)) return "h1";
  if (/h2|heading 2/.test(s)) return "h2";
  if (/h3|heading 3/.test(s)) return "h3";
  if (/quote/.test(s)) return "blockquote";
  return "p";
};

const q = (cmd: string) => {
  try {
    return document.queryCommandState(cmd);
  } catch {
    return false;
  }
};

function Btn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      // Cegah tombol mencuri fokus supaya seleksi teks di editor tidak hilang
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        active
          ? "bg-linear-to-r from-blue-600 to-cyan-500 text-white"
          : "text-blue-100 hover:bg-blue-500/20 hover:text-cyan-200"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span aria-hidden="true" className="mx-1 h-6 w-px bg-blue-400/20" />;

export function EditorToolbar({ targetRef }: { targetRef: RefObject<HTMLDivElement | null> }) {
  const [st, setSt] = useState<State>(INIT);

  const update = useCallback(() => {
    const el = targetRef.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.anchorNode || !el.contains(sel.anchorNode)) return;
    let block = "p";
    try {
      block = normBlock(document.queryCommandValue("formatBlock"));
    } catch {}
    setSt({
      bold: q("bold"),
      italic: q("italic"),
      underline: q("underline"),
      strike: q("strikeThrough"),
      ul: q("insertUnorderedList"),
      ol: q("insertOrderedList"),
      left: q("justifyLeft"),
      center: q("justifyCenter"),
      block,
    });
  }, [targetRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, [update]);

  const run = (cmd: string, val?: string) => {
    const el = targetRef.current;
    if (!el) return;
    if (document.activeElement !== el) el.focus();
    document.execCommand(cmd, false, val);
    update();
  };

  const setBlock = (tag: string) =>
    run("formatBlock", `<${st.block === tag && tag !== "p" ? "p" : tag}>`);

  const addLink = () => {
    const raw = window.prompt("Alamat tautan (contoh: https://contoh.com)");
    if (!raw) return;
    const url = /^(https?:|mailto:)/i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
    run("createLink", url);
  };

  return (
    <div
      role="toolbar"
      aria-label="Format teks"
      className={`${PANEL} flex flex-wrap items-center gap-0.5 p-1.5`}
    >
      <Btn label="Urungkan (Ctrl+Z)" onClick={() => run("undo")}>
        <Icon name="undo" className="h-4 w-4" />
      </Btn>
      <Btn label="Ulangi (Ctrl+Y)" onClick={() => run("redo")}>
        <Icon name="redo" className="h-4 w-4" />
      </Btn>
      <Sep />
      <Btn label="Paragraf" active={st.block === "p"} onClick={() => setBlock("p")}>¶</Btn>
      <Btn label="Judul 1" active={st.block === "h1"} onClick={() => setBlock("h1")}>H1</Btn>
      <Btn label="Judul 2" active={st.block === "h2"} onClick={() => setBlock("h2")}>H2</Btn>
      <Btn label="Judul 3" active={st.block === "h3"} onClick={() => setBlock("h3")}>H3</Btn>
      <Btn label="Kutipan" active={st.block === "blockquote"} onClick={() => setBlock("blockquote")}>❝</Btn>
      <Sep />
      <Btn label="Tebal (Ctrl+B)" active={st.bold} onClick={() => run("bold")}>
        <span className="text-sm font-bold">B</span>
      </Btn>
      <Btn label="Miring (Ctrl+I)" active={st.italic} onClick={() => run("italic")}>
        <span className="text-sm italic">I</span>
      </Btn>
      <Btn label="Garis bawah (Ctrl+U)" active={st.underline} onClick={() => run("underline")}>
        <span className="text-sm underline">U</span>
      </Btn>
      <Btn label="Coret" active={st.strike} onClick={() => run("strikeThrough")}>
        <span className="text-sm line-through">S</span>
      </Btn>
      <Sep />
      <Btn label="Daftar poin" active={st.ul} onClick={() => run("insertUnorderedList")}>
        <Icon name="list" className="h-4 w-4" />
      </Btn>
      <Btn label="Daftar nomor" active={st.ol} onClick={() => run("insertOrderedList")}>1.</Btn>
      <Sep />
      <Btn label="Rata kiri" active={st.left} onClick={() => run("justifyLeft")}>
        <Icon name="alignLeft" className="h-4 w-4" />
      </Btn>
      <Btn label="Rata tengah" active={st.center} onClick={() => run("justifyCenter")}>
        <Icon name="alignCenter" className="h-4 w-4" />
      </Btn>
      <Sep />
      <Btn label="Sisipkan tautan" onClick={addLink}>Link</Btn>
      <Btn label="Garis pemisah" onClick={() => run("insertHorizontalRule")}>—</Btn>
      <Btn label="Hapus format" onClick={() => run("removeFormat")}>Tx</Btn>
    </div>
  );
}