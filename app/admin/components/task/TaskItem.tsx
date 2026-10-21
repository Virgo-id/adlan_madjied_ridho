"use client";

import { useEffect, useRef, useState } from "react";
import { TaskIcon } from "./TaskIcon";
import { dueInfo, type DueTone } from "./utils";
import type { Task } from "./types";

const TONE: Record<DueTone, string> = {
  late: "border-rose-400/40 bg-rose-500/15 text-rose-200",
  today: "border-amber-300/40 bg-amber-400/15 text-amber-200",
  soon: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
  later: "border-white/10 bg-white/[0.04] text-blue-100/70",
  done: "border-white/5 bg-transparent text-blue-100/35",
};

const ACTION =
  "grid h-7 w-7 place-items-center rounded-lg text-blue-100/60 outline-none transition hover:bg-white/[0.1] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300";

export function TaskItem({
  task,
  onToggle,
  onRename,
  onRemove,
}: {
  task: Task;
  onToggle: () => void;
  onRename: (title: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(task.title);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== task.title) onRename(draft);
  };

  const due = task.dueDate ? dueInfo(task.dueDate, task.done) : null;

  return (
    <li className="group flex items-start gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.05]">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={`${task.done ? "Batalkan selesai" : "Tandai selesai"}: ${task.title}`}
        onClick={onToggle}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 ${
          task.done
            ? "border-cyan-300 bg-cyan-400 text-slate-950"
            : "border-blue-200/40 text-transparent hover:border-cyan-300"
        }`}
      >
        <TaskIcon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={input}
            value={draft}
            maxLength={200}
            aria-label="Ubah judul tugas"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                e.stopPropagation(); // jangan ikut menutup panel
                setEditing(false);
              }
            }}
            className="w-full rounded-lg border border-cyan-300 bg-white/[0.06] px-2 py-0.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300/50"
          />
        ) : (
          <p
            onDoubleClick={startEdit}
            title="Klik dua kali untuk mengubah"
            className={`break-words text-sm leading-snug ${
              task.done ? "text-blue-100/40 line-through" : "text-white"
            }`}
          >
            {task.title}
          </p>
        )}

        {due && !editing && (
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${TONE[due.tone]}`}
          >
            <TaskIcon name="calendar" className="h-3 w-3" />
            {due.label}
          </span>
        )}
      </div>

      {!editing && (
        <div className="flex shrink-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <button type="button" onClick={startEdit} aria-label={`Ubah: ${task.title}`} title="Ubah" className={ACTION}>
            <TaskIcon name="pencil" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Hapus: ${task.title}`}
            title="Hapus"
            className={`${ACTION} hover:!bg-rose-500/20 hover:!text-rose-200`}
          >
            <TaskIcon name="trash" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}