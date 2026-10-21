import type { DocItem, DocKind, SortDir, SortKey } from "./types";

export const ROOT_TITLE = "Dokumen";

/* Gaya bersama, selaras dengan halaman drive */
export const PANEL = "rounded-2xl border border-blue-400/30 bg-blue-950/70";

export const BTN =
  "inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-blue-100 outline-none transition duration-150 hover:border-cyan-300/50 hover:bg-blue-500/20 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:pointer-events-none disabled:opacity-40";

export function cleanTitle(s: string) {
  return s.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function kindLabel(kind: DocKind) {
  return kind === "folder" ? "Folder" : "Dokumen";
}

export function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function countWords(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function sortItems(items: DocItem[], key: SortKey, dir: SortDir): DocItem[] {
  const m = dir === "asc" ? 1 : -1;
  const byTitle = (a: DocItem, b: DocItem) =>
    a.title.localeCompare(b.title, "id", { numeric: true, sensitivity: "base" });

  return [...items].sort((a, b) => {
    // Folder selalu di atas, seperti File Explorer
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    let r = 0;
    if (key === "title") r = byTitle(a, b);
    else if (key === "kind") r = kindLabel(a.kind).localeCompare(kindLabel(b.kind));
    else r = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
    return r !== 0 ? r * m : byTitle(a, b);
  });
}

/* ---------- Pembersih HTML (hanya jalan di browser) ---------- */

const ALLOWED = new Set([
  "p", "br", "div", "span", "h1", "h2", "h3",
  "strong", "b", "em", "i", "u", "s", "strike",
  "ul", "ol", "li", "blockquote", "hr", "a",
]);
const DROP = new Set(["script", "style", "iframe", "object", "embed", "link", "meta", "svg", "math"]);

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();

      if (DROP.has(tag)) {
        child.remove();
        continue;
      }
      if (!ALLOWED.has(tag)) {
        // Tag asing (mis. <font>): buang pembungkusnya, simpan isinya
        walk(child);
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }

      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        if (tag === "a" && name === "href" && /^(https?:|mailto:|\/|#)/i.test(attr.value.trim())) {
          continue;
        }
        if (name === "style") {
          const m = /text-align:\s*(left|center|right|justify)/i.exec(attr.value);
          if (m) child.setAttribute("style", `text-align:${m[1].toLowerCase()}`);
          else child.removeAttribute("style");
          continue;
        }
        child.removeAttribute(attr.name);
      }

      if (tag === "a") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
      walk(child);
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}