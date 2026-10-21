export type Task = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null; // format YYYY-MM-DD
  createdAt: string;
};

export type TaskFilter = "semua" | "aktif" | "selesai";