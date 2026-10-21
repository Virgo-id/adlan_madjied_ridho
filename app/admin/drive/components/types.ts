export const BUCKET_DRIVE = "drive";

// Samakan dengan kuota paket Supabase kamu (Free = 1 GB)
export const QUOTA_BYTES = 1024 * 1024 * 1024;

// File penanda agar folder kosong tetap tampil di Supabase Storage
export const HIDDEN_NAMES = [".keep", ".emptyFolderPlaceholder"];

export type Category =
  | "gambar"
  | "dokumen"
  | "video"
  | "audio"
  | "arsip"
  | "lainnya";

export type DriveItem = {
  name: string;
  path: string;
  isFolder: boolean;
  size: number;
  updatedAt: string | null;
  mime: string | null;
};

export type Usage = {
  total: number;
  files: number;
  bytes: Record<Category, number>;
  counts: Record<Category, number>;
};

export type SortKey = "name" | "updatedAt" | "kind" | "size";
export type SortDir = "asc" | "desc";
export type ViewMode = "detail" | "grid";

export type Notice = { id: number; type: "ok" | "err"; text: string };
export type Notify = (type: Notice["type"], text: string) => void;