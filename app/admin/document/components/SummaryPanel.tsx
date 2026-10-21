import Link from "next/link";
import { Icon } from "./Icon";
import { PANEL, formatDay } from "./utils";
import type { Recent } from "./types";

export function SummaryPanel({
  documents,
  folders,
  recents,
}: {
  documents: number;
  folders: number;
  recents: Recent[];
}) {
  return (
    <aside
      aria-label="Ringkasan dokumen"
      className={`${PANEL} scrollbar-biru flex min-h-0 flex-col gap-4 overflow-y-auto p-4`}
    >
      <h2 className="text-sm font-semibold text-white">Ringkasan</h2>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-blue-400/20 bg-blue-950/60 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-blue-100/80">
            <Icon name="file" className="h-4 w-4 text-sky-300" />
            Dokumen
          </dt>
          <dd className="mt-1 font-mono text-2xl font-light text-white">{documents}</dd>
        </div>
        <div className="rounded-xl border border-blue-400/20 bg-blue-950/60 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-blue-100/80">
            <Icon name="folder" className="h-4 w-4 text-amber-300" />
            Folder
          </dt>
          <dd className="mt-1 font-mono text-2xl font-light text-white">{folders}</dd>
        </div>
      </dl>

      <div className="hidden min-h-0 flex-col gap-2 md:flex">
        <h3 className="text-xs font-semibold text-blue-100/80">Terakhir diubah</h3>
        {recents.length === 0 ? (
          <p className="text-xs text-blue-100/60">Belum ada dokumen.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {recents.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/document/${r.id}`}
                  className="flex flex-col rounded-lg px-2 py-1.5 outline-none transition hover:bg-blue-500/20 focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <span className="truncate text-sm font-medium text-blue-50">{r.title}</span>
                  <span className="text-xs text-blue-100/60">{formatDay(r.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}