export type DocKind = "folder" | "document";

export type DocItem = {
  id: string;
  parentId: string | null;
  kind: DocKind;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Crumb = { id: string | null; title: string };

export type Recent = {
  id: string;
  title: string;
  parentId: string | null;
  updatedAt: string;
};

export type SortKey = "title" | "updatedAt" | "kind";
export type SortDir = "asc" | "desc";
export type ViewMode = "detail" | "grid";

export type Notice = { id: number; type: "ok" | "err"; text: string };
export type Notify = (type: Notice["type"], text: string) => void;