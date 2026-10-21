"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { AddressBar } from "./components/AddressBar";
import { ContextMenu, type MenuEntry } from "./components/ContextMenu";
import { ConfirmDialog, PromptDialog } from "./components/Dialogs";
import { ItemList } from "./components/ItemList";
import { StatusBar } from "./components/StatusBar";
import { SummaryPanel } from "./components/SummaryPanel";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import type { DocItem, Notice, SortDir, SortKey, ViewMode } from "./components/types";
import { useDocs } from "./components/useDocs";
import { sortItems } from "./components/utils";

type Dialog =
  | { type: "newFolder" }
  | { type: "newDoc" }
  | { type: "rename"; item: DocItem }
  | { type: "delete"; items: DocItem[] }
  | null;

type Menu = { x: number; y: number; entries: MenuEntry[] } | null;

const isCoarse = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export default function DocumentPage() {
  const router = useRouter();

  const [notice, setNotice] = useState<Notice | null>(null);
  const notify = useCallback(
    (type: Notice["type"], text: string) => setNotice({ id: Date.now(), type, text }),
    []
  );
  const clearNotice = useCallback(() => setNotice(null), []);

  const d = useDocs(notify);

  const [view, setView] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menu, setMenu] = useState<Menu>(null);

  // Pindah folder: bersihkan pilihan dan pencarian
  useEffect(() => {
    setSelected(new Set());
    setCursor(null);
    setSearch("");
  }, [d.folderId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? d.items.filter((i) => i.title.toLowerCase().includes(q)) : d.items;
    return sortItems(base, sortKey, sortDir);
  }, [d.items, search, sortKey, sortDir]);

  const selectedItems = useMemo(
    () => d.items.filter((i) => selected.has(i.id)),
    [d.items, selected]
  );

  /* ---------- Pilihan ---------- */

  const clear = useCallback(() => {
    setSelected(new Set());
    setCursor(null);
  }, []);

  const open = useCallback(
    (item: DocItem) => {
      if (item.kind === "folder") d.navigate(item.id);
      else router.push(`/admin/document/${item.id}`);
    },
    [d, router]
  );

  const handleSelect = (item: DocItem, index: number, e: MouseEvent) => {
    // Layar sentuh tidak punya klik ganda: satu ketukan langsung membuka
    if (isCoarse()) {
      open(item);
      return;
    }
    if (e.shiftKey && cursor) {
      const a = visible.findIndex((i) => i.id === cursor);
      if (a >= 0) {
        const [s, t] = a < index ? [a, index] : [index, a];
        setSelected(new Set(visible.slice(s, t + 1).map((i) => i.id)));
        return;
      }
    }
    if (e.ctrlKey || e.metaKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (!next.delete(item.id)) next.add(item.id);
        return next;
      });
      setCursor(item.id);
      return;
    }
    setSelected(new Set([item.id]));
    setCursor(item.id);
  };

  const handleOpen = (item: DocItem) => {
    if (!isCoarse()) open(item);
  };

  /* ---------- Aksi ---------- */

  const askRename = useCallback(
    (item?: DocItem) => {
      const target = item ?? (selectedItems.length === 1 ? selectedItems[0] : null);
      if (target) setDialog({ type: "rename", item: target });
    },
    [selectedItems]
  );

  const askDelete = useCallback(
    (items?: DocItem[]) => {
      const list = items ?? selectedItems;
      if (list.length) setDialog({ type: "delete", items: list });
    },
    [selectedItems]
  );

  /* ---------- Menu klik kanan ---------- */

  const handleContext = (e: MouseEvent, item: DocItem | null) => {
    let targets = selectedItems;
    if (item && !selected.has(item.id)) {
      targets = [item];
      setSelected(new Set([item.id]));
      setCursor(item.id);
    } else if (!item) {
      clear();
      targets = [];
    }

    let entries: MenuEntry[];
    if (targets.length === 0) {
      entries = [
        { label: "Dokumen baru", icon: "filePlus", onClick: () => setDialog({ type: "newDoc" }) },
        { label: "Folder baru", icon: "folderPlus", onClick: () => setDialog({ type: "newFolder" }) },
        "sep",
        { label: "Segarkan", icon: "refresh", onClick: () => void d.refresh() },
      ];
    } else if (targets.length === 1) {
      const t = targets[0];
      entries = [
        { label: "Buka", icon: "open", onClick: () => open(t) },
        "sep",
        { label: "Ubah nama", icon: "pencil", onClick: () => askRename(t) },
        { label: "Hapus", icon: "trash", danger: true, onClick: () => askDelete([t]) },
      ];
    } else {
      entries = [
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
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;

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
          setSelected(new Set(visible.map((i) => i.id)));
        }
        return;
      }

      const move = (to: (idx: number) => number) => {
        if (!visible.length) return;
        e.preventDefault();
        const idx = visible.findIndex((i) => i.id === cursor);
        const next = visible[Math.max(0, Math.min(to(idx), visible.length - 1))];
        setSelected(new Set([next.id]));
        setCursor(next.id);
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
            open(selectedItems[0]);
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
  }, [dialog, menu, visible, cursor, selectedItems, d, open, askRename, askDelete, clear]);

  /* ---------- Tampilan ---------- */

  const emptyText = search.trim()
    ? `Tidak ada hasil untuk "${search.trim()}" di folder ini.`
    : "Folder ini masih kosong. Buat dokumen atau folder baru dari toolbar.";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden px-4 pb-28 pt-4 font-sans text-zinc-50 antialiased md:pb-4">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3">
        <AddressBar
          crumbs={d.crumbs}
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
          busy={!!d.busy}
          onNewDoc={() => setDialog({ type: "newDoc" })}
          onNewFolder={() => setDialog({ type: "newFolder" })}
          onOpen={() => selectedItems.length === 1 && open(selectedItems[0])}
          onRename={() => askRename()}
          onDelete={() => askDelete()}
        />

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 md:grid-cols-[272px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
          <SummaryPanel
            documents={d.counts.documents}
            folders={d.counts.folders}
            recents={d.recents}
          />

          <ItemList
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
                setSortDir(k === "updatedAt" ? "desc" : "asc");
              }
            }}
            onSelect={handleSelect}
            onOpen={handleOpen}
            onContext={handleContext}
            onClear={clear}
          />
        </div>

        <StatusBar total={visible.length} selectedCount={selectedItems.length} busy={d.busy} />
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} entries={menu.entries} onClose={() => setMenu(null)} />
      )}

      {dialog?.type === "newFolder" && (
        <PromptDialog
          title="Folder baru"
          label="Nama folder"
          initial="Folder baru"
          confirmText="Buat"
          onSubmit={async (v) => (await d.create("folder", v)).error ?? null}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "newDoc" && (
        <PromptDialog
          title="Dokumen baru"
          label="Judul dokumen"
          initial="Dokumen baru"
          confirmText="Buat"
          onSubmit={async (v) => {
            const r = await d.create("document", v);
            if (r.error) return r.error;
            router.push(`/admin/document/${r.id}`);
            return null;
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "rename" && (
        <PromptDialog
          title="Ubah nama"
          label="Nama baru"
          initial={dialog.item.title}
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
              ? `"${dialog.items[0].title}"${
                  dialog.items[0].kind === "folder" ? " beserta seluruh isinya" : ""
                } akan dihapus dan tidak bisa dikembalikan.`
              : `${dialog.items.length} item (termasuk isi folder, jika ada) akan dihapus dan tidak bisa dikembalikan.`
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