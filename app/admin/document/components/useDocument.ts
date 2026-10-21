"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cleanTitle, sanitizeHtml } from "./utils";

export type SaveState = "saved" | "dirty" | "saving" | "error";

export type DocData = {
  id: string;
  parentId: string | null;
  title: string;
  content: string;
  updatedAt: string;
};

type Patch = { title?: string; content?: string };

export function useDocument(id: string) {
  const [state, setState] = useState<"loading" | "missing" | "ready">("loading");
  const [doc, setDoc] = useState<DocData | null>(null);
  const [save, setSave] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const pending = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setState("loading");
      const { data, error } = await supabase
        .from("dokumen")
        .select("id,parent_id,title,content,updated_at")
        .eq("id", id)
        .eq("kind", "document")
        .maybeSingle();
      if (!alive) return;
      if (error || !data) {
        setState("missing");
        return;
      }
      const row = data as {
        id: string;
        parent_id: string | null;
        title: string;
        content: string;
        updated_at: string;
      };
      setDoc({
        id: row.id,
        parentId: row.parent_id,
        title: row.title,
        content: row.content ?? "",
        updatedAt: row.updated_at,
      });
      setSavedAt(row.updated_at);
      setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inflight.current) await inflight.current;

    const patch = { ...pending.current };
    if (patch.title === undefined && patch.content === undefined) return;
    pending.current = {};
    setSave("saving");

    const body: Record<string, string> = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) body.title = cleanTitle(patch.title) || "Tanpa judul";
    if (patch.content !== undefined) body.content = sanitizeHtml(patch.content);

    const run = (async () => {
      const { error } = await supabase.from("dokumen").update(body).eq("id", id);
      if (error) {
        // Kembalikan ke antrean; perubahan yang lebih baru tetap menang
        pending.current = { ...patch, ...pending.current };
        setSave("error");
        return;
      }
      setSavedAt(body.updated_at);
      const more = pending.current.title !== undefined || pending.current.content !== undefined;
      setSave(more ? "dirty" : "saved");
    })();

    inflight.current = run;
    await run;
    inflight.current = null;
  }, [id]);

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const queue = useCallback((patch: Patch) => {
    pending.current = { ...pending.current, ...patch };
    setSave("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), 1200);
  }, []);

  // Simpan saat pindah halaman, tab disembunyikan, atau browser ditutup
  useEffect(() => {
    const hasPending = () =>
      pending.current.title !== undefined || pending.current.content !== undefined;
    const onHide = () => {
      if (document.visibilityState === "hidden" && hasPending()) void flushRef.current();
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (hasPending()) {
        void flushRef.current();
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
      void flushRef.current();
    };
  }, []);

  return {
    state,
    doc,
    save,
    savedAt,
    flush,
    setTitle: (title: string) => queue({ title }),
    setContent: (content: string) => queue({ content }),
  };
}