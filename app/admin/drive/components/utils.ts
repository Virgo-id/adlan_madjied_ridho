import type { Category, DriveItem, SortDir, SortKey } from "./types";

/* Gaya bersama, selaras dengan halaman beranda admin */
export const PANEL =
  "rounded-2xl border border-blue-400/30 bg-blue-950/70";

export const BTN =
  "inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-blue-100 outline-none transition duration-150 hover:border-cyan-300/50 hover:bg-blue-500/20 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:pointer-events-none disabled:opacity-40";

export const CATEGORIES: Category[] = [
  "gambar",
  "dokumen",
  "video",
  "audio",
  "arsip",
  "lainnya",
];

export const CATEGORY_META: Record<Category, { label: string; color: string }> =
  {
    gambar: { label: "Gambar", color: "#38bdf8" },
    dokumen: { label: "Dokumen", color: "#60a5fa" },
    video: { label: "Video", color: "#a78bfa" },
    audio: { label: "Audio", color: "#f472b6" },
    arsip: { label: "Arsip", color: "#fbbf24" },
    lainnya: { label: "Lainnya", color: "#94a3b8" },
  };

const EXT: Record<Exclude<Category, "lainnya">, string[]> = {
  gambar: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif", "heic", "ico"],
  dokumen: [
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "txt", "md", "csv", "rtf", "odt", "ods", "odp", "json",
  ],
  video: ["mp4", "mkv", "mov", "avi", "webm", "m4v"],
  audio: ["mp3", "wav", "ogg", "m4a", "flac", "aac"],
  arsip: ["zip", "rar", "7z", "tar", "gz", "tgz"],
};

export function getExt(name: string) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function getCategory(name: string, mime?: string | null): Category {
  const ext = getExt(name);
  for (const c of Object.keys(EXT) as (keyof typeof EXT)[]) {
    if (EXT[c].includes(ext)) return c;
  }
  if (mime) {
    if (mime.startsWith("image/")) return "gambar";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("text/") || mime === "application/pdf") return "dokumen";
  }
  return "lainnya";
}

export function kindLabel(item: Pick<DriveItem, "name" | "isFolder">) {
  if (item.isFolder) return "Folder";
  const ext = getExt(item.name);
  return ext ? `File ${ext.toUpperCase()}` : "File";
}

export function formatSize(bytes: number) {
  if (bytes <= 0) return "0 B";
  const unit = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unit.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${v.toLocaleString("id-ID", { maximumFractionDigits: i === 0 ? 0 : 1 })} ${unit[i]}`;
}

export function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function joinPath(parent: string, name: string) {
  return parent ? `${parent}/${name}` : name;
}

/* Key Supabase Storage tidak menerima semua karakter, jadi nama dibersihkan */
export function safeName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
}

/* Tambahkan " (2)", " (3)" bila nama sudah ada */
export function uniqueName(name: string, taken: Set<string>) {
  const lower = new Set([...taken].map((s) => s.toLowerCase()));
  if (!lower.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let i = 2; ; i++) {
    const c = `${base} (${i})${ext}`;
    if (!lower.has(c.toLowerCase())) return c;
  }
}

export function sortItems(
  items: DriveItem[],
  key: SortKey,
  dir: SortDir
): DriveItem[] {
  const m = dir === "asc" ? 1 : -1;
  const byName = (a: DriveItem, b: DriveItem) =>
    a.name.localeCompare(b.name, "id", { numeric: true, sensitivity: "base" });

  return [...items].sort((a, b) => {
    // Folder selalu di atas, seperti File Explorer
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    let r = 0;
    if (key === "name") r = byName(a, b);
    else if (key === "size") r = a.size - b.size;
    else if (key === "kind") r = kindLabel(a).localeCompare(kindLabel(b));
    else
      r =
        (a.updatedAt ? Date.parse(a.updatedAt) : 0) -
        (b.updatedAt ? Date.parse(b.updatedAt) : 0);
    return r !== 0 ? r * m : byName(a, b);
  });
}