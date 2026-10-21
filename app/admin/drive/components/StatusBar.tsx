import { formatSize } from "./utils";

export function StatusBar({
  total,
  selectedCount,
  selectedSize,
  busy,
}: {
  total: number;
  selectedCount: number;
  selectedSize: number;
  busy: string | null;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-blue-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
    >
      <span>{total} item</span>
      {selectedCount > 0 && (
        <span>
          {selectedCount} dipilih
          {selectedSize > 0 ? ` · ${formatSize(selectedSize)}` : ""}
        </span>
      )}
      {busy && <span className="ml-auto animate-pulse font-semibold text-cyan-200">{busy}</span>}
    </div>
  );
}