import Link from "next/link";
import { Icon } from "./Icon";
import { BTN, PANEL } from "./utils";
import type { SaveState } from "./useDocument";

const LABEL: Record<SaveState, string> = {
  saved: "Tersimpan",
  dirty: "Belum tersimpan",
  saving: "Menyimpan…",
  error: "Gagal menyimpan, coba lagi",
};

export function EditorBar({
  backHref,
  title,
  onTitle,
  save,
  onSave,
}: {
  backHref: string;
  title: string;
  onTitle: (v: string) => void;
  save: SaveState;
  onSave: () => void;
}) {
  return (
    <div className={`${PANEL} flex items-center gap-2 p-2`}>
      <Link
        href={backHref}
        title="Kembali ke folder"
        aria-label="Kembali ke folder"
        className={`${BTN} px-2`}
      >
        <Icon name="back" className="h-4 w-4" />
      </Link>

      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        maxLength={120}
        placeholder="Judul dokumen"
        aria-label="Judul dokumen"
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-base font-semibold text-white outline-none placeholder:text-blue-300/50 hover:border-blue-400/30 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/60"
      />

      <span
        role="status"
        aria-live="polite"
        className={`hidden text-xs sm:inline ${
          save === "error" ? "font-semibold text-rose-300" : "text-blue-100/80"
        } ${save === "saving" ? "animate-pulse" : ""}`}
      >
        {LABEL[save]}
      </span>

      <button
        type="button"
        onClick={onSave}
        disabled={save === "saved" || save === "saving"}
        title="Simpan (Ctrl+S)"
        className={BTN}
      >
        Simpan
      </button>
    </div>
  );
}