"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { TaskIcon } from "./TaskIcon";
import { todayISO, tomorrowISO } from "./utils";

function Chip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-medium text-blue-100/80 outline-none transition hover:border-cyan-300/50 hover:bg-white/[0.08] hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      {children}
    </button>
  );
}

export function TaskForm({
  onAdd,
}: {
  onAdd: (title: string, due: string | null) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending || !title.trim()) return;
    setPending(true);
    const ok = await onAdd(title, due || null);
    setPending(false);
    if (ok) {
      setTitle("");
      setDue("");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Tambah tugas…"
          aria-label="Judul tugas"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-blue-200/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/50"
        />
        <button
          type="submit"
          disabled={pending || !title.trim()}
          aria-label="Tambah tugas"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-40"
        >
          <TaskIcon name="plus" className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <TaskIcon name="calendar" className="h-4 w-4 text-blue-200/60" />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Tenggat"
          className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] text-blue-50 outline-none [color-scheme:dark] focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/50"
        />
        <Chip onClick={() => setDue(todayISO())}>Hari ini</Chip>
        <Chip onClick={() => setDue(tomorrowISO())}>Besok</Chip>
        {due && <Chip onClick={() => setDue("")}>Hapus</Chip>}
      </div>
    </form>
  );
}