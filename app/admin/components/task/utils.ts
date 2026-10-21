import type { Task } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

// Tanggal lokal (bukan UTC) agar "hari ini" tidak meleset di zona WIB
export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayISO = () => toISODate(new Date());

export function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toISODate(d);
}

export function cleanTitle(s: string) {
  return s.replace(/\s+/g, " ").trim().slice(0, 200);
}

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export type DueTone = "late" | "today" | "soon" | "later" | "done";

export function dueInfo(iso: string, done: boolean): { label: string; tone: DueTone } {
  const short = parse(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  if (done) return { label: short, tone: "done" };

  const diff = Math.round(
    (parse(iso).getTime() - parse(todayISO()).getTime()) / 86_400_000
  );
  if (diff < 0) {
    return { label: diff === -1 ? "Kemarin" : `Terlambat ${-diff} hari`, tone: "late" };
  }
  if (diff === 0) return { label: "Hari ini", tone: "today" };
  if (diff === 1) return { label: "Besok", tone: "soon" };
  return { label: short, tone: diff <= 3 ? "soon" : "later" };
}

// Belum selesai di atas; lalu tenggat terdekat; tanpa tenggat paling bawah
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.dueDate !== b.dueDate) {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}