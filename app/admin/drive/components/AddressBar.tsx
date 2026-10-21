import { Icon, type IconName } from "./Icon";
import { BTN, PANEL } from "./utils";

type Props = {
  path: string;
  canBack: boolean;
  canForward: boolean;
  canUp: boolean;
  refreshing: boolean;
  search: string;
  onSearch: (v: string) => void;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onRefresh: () => void;
  onNavigate: (path: string) => void;
};

function NavButton({
  icon,
  label,
  disabled,
  onClick,
  spin,
}: {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  spin?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`${BTN} px-2`}
    >
      <Icon name={icon} className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
    </button>
  );
}

export function AddressBar(p: Props) {
  const parts = p.path ? p.path.split("/") : [];
  const crumbs = [
    { label: "Drive", path: "" },
    ...parts.map((name, i) => ({
      label: name,
      path: parts.slice(0, i + 1).join("/"),
    })),
  ];
  const current = crumbs[crumbs.length - 1].label;

  return (
    <div className={`${PANEL} flex flex-wrap items-center gap-2 p-2`}>
      <div className="flex items-center">
        <NavButton icon="back" label="Kembali (Alt+←)" disabled={!p.canBack} onClick={p.onBack} />
        <NavButton icon="forward" label="Maju (Alt+→)" disabled={!p.canForward} onClick={p.onForward} />
        <NavButton icon="up" label="Naik satu folder (Backspace)" disabled={!p.canUp} onClick={p.onUp} />
        <NavButton icon="refresh" label="Segarkan" onClick={p.onRefresh} spin={p.refreshing} />
      </div>

      <nav
        aria-label="Lokasi folder"
        className="flex min-w-0 flex-1 basis-48 items-center overflow-x-auto rounded-lg border border-blue-400/30 bg-blue-950/60 px-2 py-1.5 text-sm"
      >
        <Icon name="folder" className="mr-1.5 h-4 w-4 shrink-0 text-amber-300" />
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={c.path || "root"} className="flex shrink-0 items-center">
              {i > 0 && (
                <Icon name="chevron" className="mx-0.5 h-3 w-3 text-blue-300/60" />
              )}
              <button
                type="button"
                onClick={() => p.onNavigate(c.path)}
                aria-current={last ? "page" : undefined}
                className={`rounded px-1.5 py-0.5 outline-none transition hover:bg-blue-500/20 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  last ? "font-semibold text-white" : "text-blue-100"
                }`}
              >
                {c.label}
              </button>
            </span>
          );
        })}
      </nav>

      <label className="relative flex basis-44 items-center">
        <span className="sr-only">Cari di {current}</span>
        <Icon
          name="search"
          className="pointer-events-none absolute left-2.5 h-4 w-4 text-blue-300/70"
        />
        <input
          type="text"
          value={p.search}
          onChange={(e) => p.onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") p.onSearch("");
          }}
          placeholder={`Cari di ${current}`}
          className="w-full rounded-lg border border-blue-400/30 bg-blue-950/60 py-1.5 pl-8 pr-2 text-sm text-blue-50 outline-none placeholder:text-blue-300/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/60"
        />
      </label>
    </div>
  );
}