import type { Usage } from "./types";
import { QUOTA_BYTES } from "./types";
import { CATEGORIES, CATEGORY_META, PANEL, formatSize } from "./utils";

const R = 64;
const C = 2 * Math.PI * R;

export function StoragePanel({
  usage,
  loading,
}: {
  usage: Usage | null;
  loading: boolean;
}) {
  const total = usage?.total ?? 0;
  const denom = Math.max(QUOTA_BYTES, total, 1);
  const percent = (total / QUOTA_BYTES) * 100;
  const free = Math.max(QUOTA_BYTES - total, 0);

  let offset = 0;
  const segments = usage
    ? CATEGORIES.filter((c) => usage.bytes[c] > 0).map((c) => {
        const len = (usage.bytes[c] / denom) * C;
        const seg = { c, len, offset };
        offset += len;
        return seg;
      })
    : [];

  const barColor =
    percent > 90 ? "bg-rose-500" : percent > 75 ? "bg-amber-400" : "bg-linear-to-r from-blue-600 to-cyan-400";

  return (
    <aside aria-label="Pemakaian penyimpanan" className={`${PANEL} scrollbar-biru flex min-h-0 flex-col gap-4 overflow-y-auto p-4`}>
      <h2 className="text-sm font-semibold text-white">Penyimpanan</h2>

      <div className="relative mx-auto h-28 w-28 shrink-0 md:h-44 md:w-44">
        <svg
          viewBox="0 0 160 160"
          role="img"
          aria-label={`${formatSize(total)} dari ${formatSize(QUOTA_BYTES)} terpakai`}
          className="h-full w-full"
        >
          <g transform="rotate(-90 80 80)" fill="none" strokeWidth={16}>
            <circle cx="80" cy="80" r={R} stroke="rgba(96,165,250,0.15)" />
            {segments.map(({ c, len, offset: o }) => {
              const dash = Math.max(len - 1, 0.5);
              return (
                <circle
                  key={c}
                  cx="80"
                  cy="80"
                  r={R}
                  stroke={CATEGORY_META[c].color}
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-o}
                />
              );
            })}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {loading && !usage ? (
            <span className="animate-pulse text-xs font-bold uppercase tracking-widest text-blue-100">
              Menghitung
            </span>
          ) : usage ? (
            <>
              <span className="font-mono text-xl font-light text-white md:text-3xl">
                {percent.toLocaleString("id-ID", { maximumFractionDigits: percent < 10 ? 1 : 0 })}%
              </span>
              <span className="text-xs text-blue-100/80">terpakai</span>
            </>
          ) : (
            <span className="px-4 text-xs text-blue-100/80">Data belum bisa dimuat</span>
          )}
        </div>
      </div>

      {usage && (
        <>
          <div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(Math.round(percent), 100)}
              aria-label="Kuota penyimpanan"
              className="h-2 overflow-hidden rounded-full bg-blue-400/15"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-blue-100">
              <span className="font-semibold text-white">{formatSize(total)}</span> dari{" "}
              {formatSize(QUOTA_BYTES)} · sisa {formatSize(free)}
            </p>
          </div>

          <ul className="hidden flex-col gap-1.5 text-xs md:flex">
            {CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-2 text-blue-100">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: CATEGORY_META[c].color }}
                />
                <span className="flex-1">{CATEGORY_META[c].label}</span>
                <span className="text-blue-100/60">{usage.counts[c]} file</span>
                <span className="w-16 text-right font-medium text-white">
                  {formatSize(usage.bytes[c])}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}