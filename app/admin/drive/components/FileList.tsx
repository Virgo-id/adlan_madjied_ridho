import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { FileIcon } from "./FileIcon";
import { Icon } from "./Icon";
import { PANEL, formatDate, formatSize, kindLabel } from "./utils";
import type { DriveItem, SortDir, SortKey, ViewMode } from "./types";

type Props = {
  items: DriveItem[];
  view: ViewMode;
  selected: Set<string>;
  cursor: string | null;
  sortKey: SortKey;
  sortDir: SortDir;
  loading: boolean;
  emptyText: string;
  onSort: (k: SortKey) => void;
  onSelect: (item: DriveItem, index: number, e: MouseEvent) => void;
  onOpen: (item: DriveItem) => void;
  onContext: (e: MouseEvent, item: DriveItem | null) => void;
  onClear: () => void;
};

const COLS =
  "grid grid-cols-[minmax(0,1fr)_84px] md:grid-cols-[minmax(0,1fr)_150px_110px_84px] items-center gap-3 px-3";

const HEADERS: { key: SortKey; label: string; cls: string }[] = [
  { key: "name", label: "Nama", cls: "" },
  { key: "updatedAt", label: "Tanggal diubah", cls: "hidden md:block" },
  { key: "kind", label: "Jenis", cls: "hidden md:block" },
  { key: "size", label: "Ukuran", cls: "text-right" },
];

export function FileList(p: Props) {
  const refs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (p.cursor) refs.current.get(p.cursor)?.scrollIntoView({ block: "nearest" });
  }, [p.cursor]);

  const setRef = (path: string) => (el: HTMLDivElement | null) => {
    if (el) refs.current.set(path, el);
    else refs.current.delete(path);
  };

  const rowState = (item: DriveItem) => {
    const sel = p.selected.has(item.path);
    const cur = p.cursor === item.path;
    return `${
      sel
        ? "bg-linear-to-r from-blue-600/70 to-cyan-500/40 text-white"
        : "text-blue-100 hover:bg-blue-500/20 hover:text-cyan-100"
    } ${cur ? "ring-1 ring-inset ring-cyan-300/70" : ""}`;
  };

  const handlers = (item: DriveItem, i: number) => ({
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
                p.sortKey === h.key
                  ? p.sortDir === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
              className={h.cls}
            >
              <button
                type="button"
                onClick={() => p.onSort(h.key)}
                className={`inline-flex items-center gap-1 rounded px-1 py-0.5 outline-none transition hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  h.key === "size" ? "flex-row-reverse" : ""
                }`}
              >
                {h.label}
                {p.sortKey === h.key && (
                  <Icon
                    name="up"
                    className={`h-3 w-3 ${p.sortDir === "desc" ? "rotate-180" : ""}`}
                  />
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
              key={item.path}
              ref={setRef(item.path)}
              role="option"
              aria-selected={p.selected.has(item.path)}
              {...handlers(item, i)}
              className={`${COLS} cursor-default select-none rounded-lg py-1.5 text-sm transition-colors ${rowState(item)}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FileIcon name={item.name} mime={item.mime} isFolder={item.isFolder} />
                <span className="truncate font-medium">{item.name}</span>
              </div>
              <div className="hidden text-xs opacity-80 md:block">
                {formatDate(item.updatedAt)}
              </div>
              <div className="hidden text-xs opacity-80 md:block">{kindLabel(item)}</div>
              <div className="text-right text-xs opacity-80">
                {item.isFolder ? "" : formatSize(item.size)}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-2 content-start gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {p.items.map((item, i) => (
              <div
                key={item.path}
                ref={setRef(item.path)}
                role="option"
                aria-selected={p.selected.has(item.path)}
                {...handlers(item, i)}
                className={`flex cursor-default select-none flex-col items-center gap-2 rounded-xl px-2 py-4 text-center transition-colors ${rowState(item)}`}
              >
                <FileIcon
                  name={item.name}
                  mime={item.mime}
                  isFolder={item.isFolder}
                  className="h-16 w-16"
                />
                <span className="line-clamp-2 w-full break-all text-sm font-medium">
                  {item.name}
                </span>
                <span className="text-xs opacity-70">
                  {item.isFolder ? "Folder" : formatSize(item.size)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}