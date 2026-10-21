"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BUCKET_DRIVE,
  HIDDEN_NAMES,
  type DriveItem,
  type Notify,
  type Usage,
} from "./types";
import {
  CATEGORIES,
  getCategory,
  joinPath,
  safeName,
  uniqueName,
} from "./utils";

const PAGE = 1000;

type RawObject = {
  name: string;
  id: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: { size?: number; mimetype?: string } | null;
};

const toItem = (o: RawObject, parent: string): DriveItem => ({
  name: o.name,
  path: joinPath(parent, o.name),
  isFolder: o.id === null, // folder di Supabase Storage tidak punya id
  size: Number(o.metadata?.size ?? 0),
  updatedAt: o.updated_at ?? o.created_at ?? null,
  mime: o.metadata?.mimetype ?? null,
});

const errMsg = (e: unknown) =>
  e instanceof Error
    ? e.message
    : (e as { message?: string } | null)?.message ?? "Terjadi kesalahan.";

const emptyRecord = () =>
  Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Usage["bytes"];

export function useDrive(notify: Notify) {
  const store = useMemo(() => supabase.storage.from(BUCKET_DRIVE), []);

  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);
  const say = useCallback<Notify>((t, m) => notifyRef.current(t, m), []);

  const [nav, setNav] = useState({ stack: [""], idx: 0 });
  const path = nav.stack[nav.idx];

  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  /* ---------- Baca data ---------- */

  const listFolder = useCallback(
    async (p: string) => {
      const out: DriveItem[] = [];
      for (let offset = 0; ; offset += PAGE) {
        const { data, error } = await store.list(p, {
          limit: PAGE,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw error;
        const rows = (data ?? []) as unknown as RawObject[];
        out.push(...rows.map((r) => toItem(r, p)));
        if (rows.length < PAGE) break;
      }
      return out;
    },
    [store]
  );

  // Semua file (termasuk penanda folder) di bawah sebuah prefix
  const walkFiles = useCallback(
    async (prefix: string) => {
      const files: DriveItem[] = [];
      const stack = [prefix];
      while (stack.length) {
        const cur = stack.pop()!;
        for (const r of await listFolder(cur)) {
          if (r.isFolder) stack.push(r.path);
          else files.push(r);
        }
      }
      return files;
    },
    [listFolder]
  );

  const reqId = useRef(0);
  const load = useCallback(
    async (p: string) => {
      const id = ++reqId.current;
      setLoading(true);
      try {
        const rows = await listFolder(p);
        if (id !== reqId.current) return;
        setItems(rows.filter((r) => !HIDDEN_NAMES.includes(r.name)));
      } catch (e) {
        if (id !== reqId.current) return;
        setItems([]);
        say("err", `Gagal memuat folder: ${errMsg(e)}`);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [listFolder, say]
  );

  const loadUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const files = await walkFiles("");
      const bytes = emptyRecord();
      const counts = emptyRecord();
      let total = 0;
      let count = 0;
      for (const f of files) {
        if (HIDDEN_NAMES.includes(f.name)) continue;
        const c = getCategory(f.name, f.mime);
        bytes[c] += f.size;
        counts[c] += 1;
        total += f.size;
        count += 1;
      }
      setUsage({ total, files: count, bytes, counts });
    } catch {
      setUsage(null);
    } finally {
      setUsageLoading(false);
    }
  }, [walkFiles]);

  useEffect(() => {
    load(path);
  }, [path, load]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const refresh = useCallback(
    async () => {
      await Promise.all([load(path), loadUsage()]);
    },
    [load, loadUsage, path]
  );

  /* ---------- Navigasi (riwayat seperti Explorer) ---------- */

  const navigate = useCallback((p: string) => {
    setNav((n) =>
      p === n.stack[n.idx]
        ? n
        : { stack: [...n.stack.slice(0, n.idx + 1), p], idx: n.idx + 1 }
    );
  }, []);
  const back = useCallback(
    () => setNav((n) => (n.idx > 0 ? { ...n, idx: n.idx - 1 } : n)),
    []
  );
  const forward = useCallback(
    () =>
      setNav((n) => (n.idx < n.stack.length - 1 ? { ...n, idx: n.idx + 1 } : n)),
    []
  );
  const up = useCallback(() => {
    if (!path) return;
    navigate(path.split("/").slice(0, -1).join("/"));
  }, [path, navigate]);

  /* ---------- Aksi ---------- */

  const upload = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const taken = new Set(items.map((i) => i.name));
      let ok = 0;
      let fail = 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setBusy(`Mengunggah ${i + 1} dari ${files.length}…`);
        const name = uniqueName(safeName(f.name) || "file", taken);
        taken.add(name);
        const { error } = await store.upload(joinPath(path, name), f, {
          contentType: f.type || undefined,
          upsert: false,
        });
        if (error) {
          fail++;
          say("err", `${f.name}: ${error.message}`);
        } else ok++;
      }
      setBusy(null);
      if (ok) say("ok", `${ok} file berhasil diunggah${fail ? `, ${fail} gagal` : ""}.`);
      await refresh();
    },
    [items, path, store, say, refresh]
  );

  const createFolder = useCallback(
    async (raw: string): Promise<string | null> => {
      const name = safeName(raw.trim());
      if (!name) return "Nama folder tidak valid.";
      if (items.some((i) => i.name.toLowerCase() === name.toLowerCase()))
        return "Nama itu sudah dipakai di folder ini.";
      const { error } = await store.upload(
        `${joinPath(path, name)}/.keep`,
        new File([""], ".keep", { type: "text/plain" }),
        { upsert: false }
      );
      if (error) return error.message;
      say("ok", `Folder "${name}" dibuat.`);
      await refresh();
      return null;
    },
    [items, path, store, say, refresh]
  );

  const rename = useCallback(
    async (item: DriveItem, raw: string): Promise<string | null> => {
      const name = safeName(raw.trim());
      if (!name) return "Nama tidak valid.";
      if (name === item.name) return null;
      if (
        items.some(
          (i) => i.path !== item.path && i.name.toLowerCase() === name.toLowerCase()
        )
      )
        return "Nama itu sudah dipakai di folder ini.";

      const dest = joinPath(path, name);
      setBusy("Mengubah nama…");
      try {
        if (!item.isFolder) {
          const { error } = await store.move(item.path, dest);
          if (error) throw error;
        } else {
          // Storage tidak punya rename folder: pindahkan tiap file di dalamnya
          for (const f of await walkFiles(item.path)) {
            const { error } = await store.move(
              f.path,
              dest + f.path.slice(item.path.length)
            );
            if (error) throw error;
          }
        }
        say("ok", "Nama berhasil diubah.");
        await refresh();
        return null;
      } catch (e) {
        await refresh();
        return errMsg(e);
      } finally {
        setBusy(null);
      }
    },
    [items, path, store, walkFiles, say, refresh]
  );

  const remove = useCallback(
    async (targets: DriveItem[]) => {
      setBusy("Menghapus…");
      try {
        const paths: string[] = [];
        for (const t of targets) {
          if (t.isFolder) (await walkFiles(t.path)).forEach((f) => paths.push(f.path));
          else paths.push(t.path);
        }
        for (let i = 0; i < paths.length; i += 100) {
          const { error } = await store.remove(paths.slice(i, i + 100));
          if (error) throw error;
        }
        say("ok", `${targets.length} item dihapus.`);
      } catch (e) {
        say("err", `Gagal menghapus: ${errMsg(e)}`);
      } finally {
        setBusy(null);
        await refresh();
      }
    },
    [store, walkFiles, say, refresh]
  );

  const signed = useCallback(
    async (item: DriveItem, download: boolean) => {
      const { data, error } = await store.createSignedUrl(
        item.path,
        3600,
        download ? { download: item.name } : undefined
      );
      if (error || !data) {
        say("err", `Gagal membuka ${item.name}: ${error?.message ?? "tautan kosong"}`);
        return null;
      }
      return data.signedUrl;
    },
    [store, say]
  );

  const download = useCallback(
    async (list: DriveItem[]) => {
      for (const f of list.filter((i) => !i.isFolder)) {
        const url = await signed(f, true);
        if (!url) continue;
        const a = document.createElement("a");
        a.href = url;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        await new Promise((r) => setTimeout(r, 400));
      }
    },
    [signed]
  );

  const openItem = useCallback(
    async (item: DriveItem) => {
      if (item.isFolder) {
        navigate(item.path);
        return;
      }
      // Buka tab dulu agar tidak diblokir popup blocker, URL menyusul
      const w = window.open("about:blank", "_blank");
      const url = await signed(item, false);
      if (!url) {
        w?.close();
        return;
      }
      if (w) {
        w.opener = null;
        w.location.href = url;
      } else window.location.assign(url);
    },
    [navigate, signed]
  );

  return {
    path,
    items,
    loading,
    usage,
    usageLoading,
    busy,
    canBack: nav.idx > 0,
    canForward: nav.idx < nav.stack.length - 1,
    canUp: path !== "",
    navigate,
    back,
    forward,
    up,
    refresh,
    upload,
    createFolder,
    rename,
    remove,
    download,
    openItem,
  };
}