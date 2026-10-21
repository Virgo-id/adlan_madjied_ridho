import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { Icon } from "./Icon";
import { PANEL, formatDate, kindLabel } from "./utils";
import type { DocItem, SortDir, SortKey, ViewMode } from "./types";

type Props = {
  items: DocItem[];
  view: ViewMode;
  selected: Set<string>;
  cursor: string | null;
  sortKey: SortKey;
  sortDir: SortDir;
  loading: boolean;
  emptyText: string;
  onSort: (k: SortKey) => void;
  onSelect: (item: DocItem, index: number, e: MouseEvent) => void;
  onOpen: (item: DocItem) => void;
  onContext: (e: MouseEvent, item: DocItem | null) => void;
  onClear: () => void;
};

const COLS =
  "grid grid-cols-[minmax(0,1fr)_150px] md:grid-cols-[minmax(0,1fr)_170px_110px] items-center gap-3 px-3";

const HEADERS: { key: SortKey; label: string; cls: string }[] = [
  { key: "title", label: "Nama", cls: "" },
  { key: "updatedAt", label: "Tanggal diubah", cls: "" },
  { key: "kind", label: "Jenis", cls: "hidden md:block" },
];

function ItemIcon({ item, className }: { item: DocItem; className: string }) {
  return item.kind === "folder" ? (
    <Icon name="folder" className={`${className} text-amber-300`} />
  ) : (
    <Icon name="file" className={`${className} text-sky-300`} />
  );
}

export function ItemList(p: Props) {
  const refs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (p.cursor) refs.current.get(p.cursor)?.scrollIntoView({ block: "nearest" });
  }, [p.cursor]);

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  };

  const rowState = (item: DocItem) => {
    const sel = p.selected.has(item.id);
    const cur = p.cursor === item.id;
    return `${
      sel
        ? "bg-linear-to-r from-blue-600/70 to-cyan-500/40 text-white"
        : "text-blue-100 hover:bg-blue-500/20 hover:text-cyan-100"
    } ${cur ? "ring-1 ring-inset ring-cyan-300/70" : ""}`;
  };

  const handlers = (item: DocItem, i: number) => ({
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      p.onSelect(item, i, e);
    },
    onDoubleClick: () => p.onOpen(item),
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      p.onContext(e, item);
    },
  });

  return (
    <div className={`${PANEL} flex h-full min-h-0 flex-col overflow-hidden`}>
      {p.view === "detail" && (
        <div
          role="row"
          className={`${COLS} border-b border-blue-400/20 py-2 text-xs font-semibold text-blue-100/80`}
        >
          {HEADERS.map((h) => (
            <div
              key={h.key}
              role="columnheader"
              aria-sort={
                p.sortKey === h.key ? (p.sortDir === "asc" ? "ascending" : "descending") : "none"
              }
              className={h.cls}
            >
              <button
                type="button"
                onClick={() => p.onSort(h.key)}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 outline-none transition hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {h.label}
                {p.sortKey === h.key && (
                  <Icon name="up" className={`h-3 w-3 ${p.sortDir === "desc" ? "rotate-180" : ""}`} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        role="listbox"
        aria-label="Isi folder"
        aria-multiselectable="true"
        className="scrollbar-biru min-h-0 flex-1 overflow-auto p-1.5"
        onClick={(e) => {
          if (e.target === e.currentTarget) p.onClear();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          p.onContext(e, null);
        }}
      >
        {p.loading && p.items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-blue-100">
              Memuat…
            </div>
          </div>
        ) : p.items.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 text-center">
            <Icon name="folder" className="h-12 w-12 text-blue-300/40" />
            <p className="max-w-xs text-sm text-blue-100/80">{p.emptyText}</p>
          </div>
        ) : p.view === "detail" ? (
          p.items.map((item, i) => (
            <div
              key={item.id}
              ref={setRef(item.id)}
              role="option"
              aria-selected={p.selected.has(item.id)}
              {...handlers(item, i)}
              className={`${COLS} cursor-default select-none rounded-lg py-1.5 text-sm transition-colors ${rowState(item)}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <ItemIcon item={item} className="h-5 w-5 shrink-0" />
                <span className="truncate font-medium">{item.title}</span>
              </div>
              <div className="text-xs opacity-80">{formatDate(item.updatedAt)}</div>
              <div className="hidden text-xs opacity-80 md:block">{kindLabel(item.kind)}</div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-2 content-start gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {p.items.map((item, i) => (
              <div
                key={item.id}
                ref={setRef(item.id)}
                role="option"
                aria-selected={p.selected.has(item.id)}
                {...handlers(item, i)}
                className={`flex cursor-default select-none flex-col items-center gap-2 rounded-xl px-2 py-4 text-center transition-colors ${rowState(item)}`}
              >
                <ItemIcon item={item} className="h-16 w-16" />
                <span className="line-clamp-2 w-full break-words text-sm font-medium">
                  {item.title}
                </span>
                <span className="text-xs opacity-70">
                  {item.kind === "folder" ? "Folder" : formatDate(item.updatedAt).split(",")[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}