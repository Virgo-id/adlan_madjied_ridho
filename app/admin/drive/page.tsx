"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { AddressBar } from "./components/AddressBar";
import { ContextMenu, type MenuEntry } from "./components/ContextMenu";
import { ConfirmDialog, PromptDialog } from "./components/Dialogs";
import { DropZone } from "./components/DropZone";
import { FileList } from "./components/FileList";
import { StatusBar } from "./components/StatusBar";
import { StoragePanel } from "./components/StoragePanel";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import type {
  DriveItem,
  Notice,
  SortDir,
  SortKey,
  ViewMode,
} from "./components/types";
import { useDrive } from "./components/useDrive";
import { sortItems } from "./components/utils";

type Dialog =
  | { type: "newFolder" }
  | { type: "rename"; item: DriveItem }
  | { type: "delete"; items: DriveItem[] }
  | null;

type Menu = { x: number; y: number; entries: MenuEntry[] } | null;

const isCoarse = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export default function DrivePage() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const notify = useCallback(
    (type: Notice["type"], text: string) => setNotice({ id: Date.now(), type, text }),
    []
  );
  const clearNotice = useCallback(() => setNotice(null), []);

  const d = useDrive(notify);

  const [view, setView] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Pindah folder: bersihkan pilihan dan pencarian
  useEffect(() => {
    setSelected(new Set());
    setCursor(null);
    setSearch("");
  }, [d.path]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? d.items.filter((i) => i.name.toLowerCase().includes(q)) : d.items;
    return sortItems(base, sortKey, sortDir);
  }, [d.items, search, sortKey, sortDir]);

  const selectedItems = useMemo(
    () => d.items.filter((i) => selected.has(i.path)),
    [d.items, selected]
  );
  const selectedSize = selectedItems.reduce((n, i) => n + (i.isFolder ? 0 : i.size), 0);
  const hasFile = selectedItems.some((i) => !i.isFolder);

  const folderLabel = d.path ? d.path.split("/").pop()! : "Drive";

  /* ---------- Pilihan ---------- */

  const clear = useCallback(() => {
    setSelected(new Set());
    setCursor(null);
  }, []);

  const handleSelect = (item: DriveItem, index: number, e: MouseEvent) => {
    // Layar sentuh tidak punya klik ganda: satu ketukan langsung membuka
    if (isCoarse()) {
      d.openItem(item);
      return;
    }
    if (e.shiftKey && cursor) {
      const a = visible.findIndex((i) => i.path === cursor);
      if (a >= 0) {
        const [s, t] = a < index ? [a, index] : [index, a];
        setSelected(new Set(visible.slice(s, t + 1).map((i) => i.path)));
        return;
      }
    }
    if (e.ctrlKey || e.metaKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (!next.delete(item.path)) next.add(item.path);
        return next;
      });
      setCursor(item.path);
      return;
    }
    setSelected(new Set([item.path]));
    setCursor(item.path);
  };

  const handleOpen = (item: DriveItem) => {
    if (!isCoarse()) d.openItem(item);
  };

  /* ---------- Aksi ---------- */

  const askRename = useCallback(
    (item?: DriveItem) => {
      const target = item ?? (selectedItems.length === 1 ? selectedItems[0] : null);
      if (target) setDialog({ type: "rename", item: target });
    },
    [selectedItems]
  );

  const askDelete = useCallback(
    (items?: DriveItem[]) => {
      const list = items ?? selectedItems;
      if (list.length) setDialog({ type: "delete", items: list });
    },
    [selectedItems]
  );

  const pickFiles = () => fileInput.current?.click();

  /* ---------- Menu klik kanan ---------- */

  const handleContext = (e: MouseEvent, item: DriveItem | null) => {
    let targets = selectedItems;
    if (item && !selected.has(item.path)) {
      targets = [item];
      setSelected(new Set([item.path]));
      setCursor(item.path);
    } else if (!item) {
      clear();
      targets = [];
    }

    let entries: MenuEntry[];
    if (targets.length === 0) {
      entries = [
        { label: "Folder baru", icon: "folderPlus", onClick: () => setDialog({ type: "newFolder" }) },
        { label: "Unggah file", icon: "upload", onClick: pickFiles },
        "sep",
        { label: "Segarkan", icon: "refresh", onClick: () => void d.refresh() },
      ];
    } else if (targets.length === 1) {
      const t = targets[0];
      entries = [
        { label: "Buka", icon: "open", onClick: () => void d.openItem(t) },
        { label: "Unduh", icon: "download", disabled: t.isFolder, onClick: () => void d.download([t]) },
        "sep",
        { label: "Ubah nama", icon: "pencil", onClick: () => askRename(t) },
        { label: "Hapus", icon: "trash", danger: true, onClick: () => askDelete([t]) },
      ];
    } else {
      entries = [
        {
          label: "Unduh file",
          icon: "download",
          disabled: !targets.some((t) => !t.isFolder),
          onClick: () => void d.download(targets),
        },
        "sep",
        { label: `Hapus ${targets.length} item`, icon: "trash", danger: true, onClick: () => askDelete(targets) },
      ];
    }
    setMenu({ x: e.clientX, y: e.clientY, entries });
  };

  /* ---------- Keyboard ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialog || menu) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
      )
        return;

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === "ArrowLeft") { e.preventDefault(); d.back(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); d.forward(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); d.up(); }
        return;
      }
      if (e.altKey || e.metaKey || e.shiftKey) return;

      if (e.ctrlKey) {
        if (e.key.toLowerCase() === "a") {
          e.preventDefault();
          setSelected(new Set(visible.map((i) => i.path)));
        }
        return;
      }

      const move = (to: (idx: number) => number) => {
        if (!visible.length) return;
        e.preventDefault();
        const idx = visible.findIndex((i) => i.path === cursor);
        const next = visible[Math.max(0, Math.min(to(idx), visible.length - 1))];
        setSelected(new Set([next.path]));
        setCursor(next.path);
      };

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          move((i) => (i < 0 ? 0 : i + 1));
          break;
        case "ArrowUp":
        case "ArrowLeft":
          move((i) => (i < 0 ? visible.length - 1 : i - 1));
          break;
        case "Home":
          move(() => 0);
          break;
        case "End":
          move(() => visible.length - 1);
          break;
        case "Enter":
          if (selectedItems.length === 1) {
            e.preventDefault();
            void d.openItem(selectedItems[0]);
          }
          break;
        case "Backspace":
          e.preventDefault();
          d.up();
          break;
        case "F2":
          e.preventDefault();
          askRename();
          break;
        case "Delete":
          e.preventDefault();
          askDelete();
          break;
        case "Escape":
          clear();
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, menu, visible, cursor, selectedItems, d, askRename, askDelete, clear]);

  /* ---------- Tampilan ---------- */

  const emptyText = search.trim()
    ? `Tidak ada hasil untuk "${search.trim()}" di folder ini.`
    : "Folder ini masih kosong. Seret file ke sini atau pilih Unggah.";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden px-4 pb-28 pt-4 font-sans text-zinc-50 antialiased md:pb-4">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3">

        <AddressBar
          path={d.path}
          canBack={d.canBack}
          canForward={d.canForward}
          canUp={d.canUp}
          refreshing={d.loading}
          search={search}
          onSearch={setSearch}
          onBack={d.back}
          onForward={d.forward}
          onUp={d.up}
          onRefresh={() => void d.refresh()}
          onNavigate={d.navigate}
        />

        <Toolbar
          view={view}
          onView={setView}
          selectedCount={selectedItems.length}
          hasFile={hasFile}
          busy={!!d.busy}
          onNewFolder={() => setDialog({ type: "newFolder" })}
          onUpload={pickFiles}
          onRename={() => askRename()}
          onDownload={() => void d.download(selectedItems)}
          onDelete={() => askDelete()}
        />

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 md:grid-cols-[272px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
          <StoragePanel usage={d.usage} loading={d.usageLoading} />

          <DropZone onFiles={(f) => void d.upload(f)} label={folderLabel}>
            <FileList
              items={visible}
              view={view}
              selected={selected}
              cursor={cursor}
              sortKey={sortKey}
              sortDir={sortDir}
              loading={d.loading}
              emptyText={emptyText}
              onSort={(k) => {
                if (k === sortKey) setSortDir((v) => (v === "asc" ? "desc" : "asc"));
                else {
                  setSortKey(k);
                  setSortDir("asc");
                }
              }}
              onSelect={handleSelect}
              onOpen={handleOpen}
              onContext={handleContext}
              onClear={clear}
            />
          </DropZone>
        </div>

        <StatusBar
          total={visible.length}
          selectedCount={selectedItems.length}
          selectedSize={selectedSize}
          busy={d.busy}
        />
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void d.upload(files);
        }}
      />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          entries={menu.entries}
          onClose={() => setMenu(null)}
        />
      )}

      {dialog?.type === "newFolder" && (
        <PromptDialog
          title="Folder baru"
          label="Nama folder"
          initial="Folder baru"
          confirmText="Buat"
          onSubmit={d.createFolder}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "rename" && (
        <PromptDialog
          title="Ubah nama"
          label="Nama baru"
          initial={dialog.item.name}
          selectBaseOnly={!dialog.item.isFolder}
          confirmText="Simpan"
          onSubmit={async (v) => {
            const err = await d.rename(dialog.item, v);
            if (!err) clear();
            return err;
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "delete" && (
        <ConfirmDialog
          title="Hapus permanen?"
          message={
            dialog.items.length === 1
              ? `"${dialog.items[0].name}"${
                  dialog.items[0].isFolder ? " beserta seluruh isinya" : ""
                } akan dihapus dan tidak bisa dikembalikan.`
              : `${dialog.items.length} item akan dihapus dan tidak bisa dikembalikan.`
          }
          confirmText="Hapus"
          onConfirm={async () => {
            await d.remove(dialog.items);
            clear();
          }}
          onClose={() => setDialog(null)}
        />
      )}

      <Toast notice={notice} onDone={clearNotice} />
    </div>
  );
}