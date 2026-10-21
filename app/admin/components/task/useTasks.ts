"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Task } from "./types";
import { cleanTitle } from "./utils";

const COLS = "id,title,done,due_date,created_at";

type Row = {
  id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  created_at: string;
};

const toTask = (r: Row): Task => ({
  id: r.id,
  title: r.title,
  done: r.done,
  dueDate: r.due_date,
  createdAt: r.created_at,
});

export type TasksApi = ReturnType<typeof useTasks>;

export function useTasks(enabled: boolean) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const alive = useRef(true);
  const tasksRef = useRef<Task[]>([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("tugas")
      .select(COLS)
      .order("created_at", { ascending: true })
      .limit(500);
    if (!alive.current) return;
    if (error) {
      setError(`Gagal memuat tugas: ${error.message}`);
      setStatus((p) => (p === "ready" ? p : "error"));
      return;
    }
    setTasks(((data ?? []) as unknown as Row[]).map(toTask));
    setStatus("ready");
    setError(null);
  }, []);

  // Muat + sinkron antar tab/perangkat lewat realtime
  useEffect(() => {
    if (!enabled) return;
    alive.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void load();

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void load(), 300);
    };

    const channel = supabase
      .channel("beranda-tugas")
      .on("postgres_changes", { event: "*", schema: "public", table: "tugas" }, schedule)
      .subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive.current = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [enabled, load]);

  const add = useCallback(async (raw: string, due: string | null) => {
    const title = cleanTitle(raw);
    if (!title) return false;
    const { data, error } = await supabase
      .from("tugas")
      .insert({ title, due_date: due })
      .select(COLS)
      .single();
    if (error) {
      setError(`Gagal menambah tugas: ${error.message}`);
      return false;
    }
    setTasks((p) => [...p, toTask(data as unknown as Row)]);
    setError(null);
    return true;
  }, []);

  // Ubah di layar dulu (terasa instan), batalkan jika server menolak
  const patch = useCallback(
    async (id: string, change: Partial<Pick<Task, "done" | "title">>) => {
      const cur = tasksRef.current.find((t) => t.id === id);
      if (!cur) return;
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...change } : t)));

      const body: Record<string, unknown> = {};
      if (change.done !== undefined) body.done = change.done;
      if (change.title !== undefined) body.title = change.title;

      const { error } = await supabase.from("tugas").update(body).eq("id", id);
      if (error) {
        setTasks((p) => p.map((t) => (t.id === id ? cur : t)));
        setError(`Gagal menyimpan: ${error.message}`);
      }
    },
    []
  );

  const toggle = useCallback(
    (id: string) => {
      const cur = tasksRef.current.find((t) => t.id === id);
      if (cur) void patch(id, { done: !cur.done });
    },
    [patch]
  );

  const rename = useCallback(
    (id: string, raw: string) => {
      const title = cleanTitle(raw);
      if (title) void patch(id, { title });
    },
    [patch]
  );

  const remove = useCallback(async (id: string) => {
    const cur = tasksRef.current.find((t) => t.id === id);
    if (!cur) return;
    setTasks((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from("tugas").delete().eq("id", id);
    if (error) {
      setTasks((p) => [...p, cur]);
      setError(`Gagal menghapus: ${error.message}`);
    }
  }, []);

  const clearDone = useCallback(async () => {
    const ids = tasksRef.current.filter((t) => t.done).map((t) => t.id);
    if (!ids.length) return;
    setTasks((p) => p.filter((t) => !t.done));
    const { error } = await supabase.from("tugas").delete().in("id", ids);
    if (error) {
      setError(`Gagal menghapus: ${error.message}`);
      void load();
    }
  }, [load]);

  return {
    tasks,
    status,
    error,
    activeCount: tasks.filter((t) => !t.done).length,
    add,
    toggle,
    rename,
    remove,
    clearDone,
    reload: load,
    dismissError: () => setError(null),
  };
}