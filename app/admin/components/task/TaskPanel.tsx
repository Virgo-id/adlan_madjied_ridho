"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { TaskForm } from "./TaskForm";
import { TaskIcon } from "./TaskIcon";
import { TaskItem } from "./TaskItem";
import type { TaskFilter } from "./types";
import type { TasksApi } from "./useTasks";
import { sortTasks } from "./utils";

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "selesai", label: "Selesai" },
];

const EMPTY: Record<TaskFilter, string> = {
  semua: "Belum ada tugas. Tulis satu di atas.",
  aktif: "Semua tugas sudah selesai.",
  selesai: "Belum ada tugas yang selesai.",
};

export function TaskPanel({ api, onClose }: { api: TasksApi; onClose: () => void }) {
  const [filter, setFilter] = useState<TaskFilter>("semua");

  const sorted = useMemo(() => sortTasks(api.tasks), [api.tasks]);
  const total = api.tasks.length;
  const done = total - api.activeCount;
  const shown = sorted.filter((t) =>
    filter === "semua" ? true : filter === "aktif" ? !t.done : t.done
  );

  // Tombol di dalam panel tidak boleh memicu pintasan huruf/panah milik beranda
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") onClose();
    e.stopPropagation();
  };

  return (
    <aside
      aria-label="Daftar tugas"
      onKeyDown={onKeyDown}
      className="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/75 p-4 font-sans text-white shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Tugas</h2>
          <p className="text-xs text-blue-100/60">
            {total === 0
              ? "Belum ada tugas"
              : `${api.activeCount} aktif · ${done} dari ${total} selesai`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel tugas"
          title="Tutup (Esc)"
          className="grid h-8 w-8 place-items-center rounded-lg text-blue-100/70 outline-none transition hover:bg-white/[0.1] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <TaskIcon name="x" className="h-4 w-4" />
        </button>
      </header>

      {total > 0 && (
        <div
          role="progressbar"
          aria-label="Kemajuan tugas"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="h-1.5 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-[width] duration-300"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      <TaskForm onAdd={api.add} />

      <div role="group" aria-label="Filter tugas" className="flex gap-1 rounded-xl border border-white/10 p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 ${
              filter === f.key
                ? "bg-white/[0.14] text-white"
                : "text-blue-100/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {api.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-100"
        >
          <span className="flex-1">{api.error}</span>
          <button
            type="button"
            onClick={api.dismissError}
            aria-label="Tutup pesan"
            className="rounded p-0.5 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-rose-200"
          >
            <TaskIcon name="x" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="scrollbar-biru -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {api.status === "loading" ? (
          <p className="animate-pulse py-8 text-center text-xs font-bold uppercase tracking-widest text-blue-100/70">
            Memuat…
          </p>
        ) : api.status === "error" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="max-w-[16rem] text-sm text-blue-100/80">
              Tugas belum bisa dimuat. Pastikan tabel <code className="text-cyan-200">tugas</code> sudah dibuat di Supabase.
            </p>
            <button
              type="button"
              onClick={() => void api.reload()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-blue-100 outline-none transition hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Coba lagi
            </button>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-sm text-blue-100/60">{EMPTY[filter]}</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {shown.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={() => api.toggle(t.id)}
                onRename={(title) => api.rename(t.id, title)}
                onRemove={() => void api.remove(t.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {done > 0 && (
        <button
          type="button"
          onClick={() => void api.clearDone()}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-blue-100/80 outline-none transition hover:border-rose-400/50 hover:bg-rose-500/15 hover:text-rose-100 focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Hapus {done} tugas yang selesai
        </button>
      )}
    </aside>
  );
}