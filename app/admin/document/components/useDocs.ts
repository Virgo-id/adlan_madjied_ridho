"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Crumb, DocItem, DocKind, Notify, Recent } from "./types";
import { ROOT_TITLE, cleanTitle } from "./utils";

const TABLE = "dokumen";
const PAGE = 1000;
const COLS = "id,parent_id,kind,title,created_at,updated_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  parent_id: string | null;
  kind: DocKind;
  title: string;
  created_at: string;
  updated_at: string;
};

const toItem = (r: Row): DocItem => ({
  id: r.id,
  parentId: r.parent_id,
  kind: r.kind,
  title: r.title,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const errMsg = (e: unknown) =>
  e instanceof Error
    ? e.message
    : (e as { message?: string } | null)?.message ?? "Terjadi kesalahan.";

export function useDocs(notify: Notify) {
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);
  const say = useCallback<Notify>((t, m) => notifyRef.current(t, m), []);

  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState<{ stack: (string | null)[]; idx: number }>({
    stack: [null],
    idx: 0,
  });
  const folderId = nav.stack[nav.idx];

  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ id: null, title: ROOT_TITLE }]);
  const [recents, setRecents] = useState<Recent[]>([]);
  const [counts, setCounts] = useState({ documents: 0, folders: 0 });
  const [busy, setBusy] = useState<string | null>(null);

  const known = useRef(new Map<string, { parentId: string | null; title: string }>());

  // Buka folder dari URL (?folder=...) agar kembali dari editor tetap di folder yang sama
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("folder");
    if (f && UUID.test(f)) setNav({ stack: [f], idx: 0 });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const url = folderId
      ? `${window.location.pathname}?folder=${folderId}`
      : window.location.pathname;
    window.history.replaceState(window.history.state, "", url);
  }, [ready, folderId]);

  /* ---------- Baca data ---------- */

  const reqId = useRef(0);
  const load = useCallback(
    async (id: string | null) => {
      const rid = ++reqId.current;
      setLoading(true);
      try {
        const out: DocItem[] = [];
        for (let from = 0; ; from += PAGE) {
          let q = supabase.from(TABLE).select(COLS);
          q = id === null ? q.is("parent_id", null) : q.eq("parent_id", id);
          const { data, error } = await q
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(from, from + PAGE - 1);
          if (error) throw error;
          const rows = (data ?? []) as unknown as Row[];
          out.push(...rows.map(toItem));
          if (rows.length < PAGE) break;
        }
        if (rid !== reqId.current) return;
        out.forEach((i) => {
          if (i.kind === "folder")
            known.current.set(i.id, { parentId: i.parentId, title: i.title });
        });
        setItems(out);
      } catch (e) {
        if (rid !== reqId.current) return;
        setItems([]);
        say("err", `Gagal memuat: ${errMsg(e)}`);
      } finally {
        if (rid === reqId.current) setLoading(false);
      }
    },
    [say]
  );

  const buildCrumbs = useCallback(async (id: string | null) => {
    const chain: Crumb[] = [];
    let cur = id;
    for (let guard = 0; cur && guard < 50; guard++) {
      let info = known.current.get(cur);
      if (!info) {
        const { data, error } = await supabase
          .from(TABLE)
          .select("id,parent_id,title")
          .eq("id", cur)
          .eq("kind", "folder")
          .maybeSingle();
        if (error || !data) break;
        info = { parentId: data.parent_id as string | null, title: data.title as string };
        known.current.set(cur, info);
      }
      chain.unshift({ id: cur, title: info.title });
      cur = info.parentId;
    }
    return [{ id: null, title: ROOT_TITLE } as Crumb, ...chain];
  }, []);

  const loadSummary = useCallback(async () => {
    const [r, d, f] = await Promise.all([
      supabase
        .from(TABLE)
        .select("id,title,parent_id,updated_at")
        .eq("kind", "document")
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase.from(TABLE).select("id", { count: "exact", head: true }).eq("kind", "document"),
      supabase.from(TABLE).select("id", { count: "exact", head: true }).eq("kind", "folder"),
    ]);
    if (!r.error) {
      setRecents(
        ((r.data ?? []) as { id: string; title: string; parent_id: string | null; updated_at: string }[]).map(
          (x) => ({ id: x.id, title: x.title, parentId: x.parent_id, updatedAt: x.updated_at })
        )
      );
    }
    if (!d.error && !f.error) setCounts({ documents: d.count ?? 0, folders: f.count ?? 0 });
  }, []);

  useEffect(() => {
    if (ready) load(folderId);
  }, [ready, folderId, load]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      const chain = await buildCrumbs(folderId);
      if (!alive) return;
      if (folderId && chain.length === 1) {
        say("err", "Folder tidak ditemukan.");
        setNav({ stack: [null], idx: 0 });
        return;
      }
      setCrumbs(chain);
    })();
    return () => {
      alive = false;
    };
  }, [ready, folderId, buildCrumbs, say]);

  useEffect(() => {
    if (ready) loadSummary();
  }, [ready, loadSummary]);

  const refresh = useCallback(async () => {
    await Promise.all([load(folderId), loadSummary()]);
  }, [load, loadSummary, folderId]);

  /* ---------- Navigasi (riwayat seperti Explorer) ---------- */

  const navigate = useCallback((id: string | null) => {
    setNav((n) =>
      id === n.stack[n.idx]
        ? n
        : { stack: [...n.stack.slice(0, n.idx + 1), id], idx: n.idx + 1 }
    );
  }, []);
  const back = useCallback(
    () => setNav((n) => (n.idx > 0 ? { ...n, idx: n.idx - 1 } : n)),
    []
  );
  const forward = useCallback(
    () => setNav((n) => (n.idx < n.stack.length - 1 ? { ...n, idx: n.idx + 1 } : n)),
    []
  );
  const up = useCallback(() => {
    if (folderId === null) return;
    navigate(crumbs.length > 1 ? crumbs[crumbs.length - 2].id : null);
  }, [folderId, crumbs, navigate]);

  /* ---------- Aksi ---------- */

  const create = useCallback(
    async (kind: DocKind, raw: string): Promise<{ id?: string; error?: string }> => {
      const title = cleanTitle(raw);
      if (!title) return { error: "Nama tidak boleh kosong." };
      if (items.some((i) => i.kind === kind && i.title.toLowerCase() === title.toLowerCase()))
        return { error: "Nama itu sudah dipakai di folder ini." };

      const { data, error } = await supabase
        .from(TABLE)
        .insert({ parent_id: folderId, kind, title })
        .select("id")
        .single();
      if (error) return { error: error.message };

      if (kind === "folder") {
        say("ok", `Folder "${title}" dibuat.`);
        await refresh();
      }
      return { id: (data as { id: string }).id };
    },
    [items, folderId, say, refresh]
  );

  const rename = useCallback(
    async (item: DocItem, raw: string): Promise<string | null> => {
      const title = cleanTitle(raw);
      if (!title) return "Nama tidak boleh kosong.";
      if (title === item.title) return null;
      if (
        items.some(
          (i) =>
            i.id !== item.id &&
            i.kind === item.kind &&
            i.title.toLowerCase() === title.toLowerCase()
        )
      )
        return "Nama itu sudah dipakai di folder ini.";

      const { error } = await supabase
        .from(TABLE)
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) return error.message;

      known.current.clear();
      say("ok", "Nama berhasil diubah.");
      await refresh();
      return null;
    },
    [items, say, refresh]
  );

  const remove = useCallback(
    async (targets: DocItem[]) => {
      setBusy("Menghapus…");
      try {
        // Isi folder ikut terhapus lewat ON DELETE CASCADE
        const { error } = await supabase
          .from(TABLE)
          .delete()
          .in("id", targets.map((t) => t.id));
        if (error) throw error;
        known.current.clear();
        say("ok", `${targets.length} item dihapus.`);
      } catch (e) {
        say("err", `Gagal menghapus: ${errMsg(e)}`);
      } finally {
        setBusy(null);
        await refresh();
      }
    },
    [say, refresh]
  );

  return {
    folderId,
    items,
    loading,
    crumbs,
    recents,
    counts,
    busy,
    canBack: nav.idx > 0,
    canForward: nav.idx < nav.stack.length - 1,
    canUp: folderId !== null,
    navigate,
    back,
    forward,
    up,
    refresh,
    create,
    rename,
    remove,
  };
}