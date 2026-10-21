import { Icon, type IconName } from "./Icon";
import { BTN, PANEL } from "./utils";
import type { ViewMode } from "./types";

type Props = {
  view: ViewMode;
  onView: (v: ViewMode) => void;
  selectedCount: number;
  hasFile: boolean;
  busy: boolean;
  onNewFolder: () => void;
  onUpload: () => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
};

function Tool({
  icon,
  label,
  onClick,
  disabled,
  danger,
  hint,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint ? `${label} (${hint})` : label}
      className={`${BTN} ${
        danger ? "hover:border-rose-400/60 hover:bg-rose-500/20 hover:text-rose-200" : ""
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

const Sep = () => <span aria-hidden="true" className="mx-1 h-6 w-px bg-blue-400/20" />;

export function Toolbar(p: Props) {
  const one = p.selectedCount === 1;
  const any = p.selectedCount > 0;

  return (
    <div
      role="toolbar"
      aria-label="Perintah file"
      className={`${PANEL} flex flex-wrap items-center gap-0.5 p-1.5`}
    >
      <Tool icon="folderPlus" label="Folder baru" onClick={p.onNewFolder} disabled={p.busy} />
      <Tool icon="upload" label="Unggah" onClick={p.onUpload} disabled={p.busy} />
      <Sep />
      <Tool icon="pencil" label="Ubah nama" hint="F2" onClick={p.onRename} disabled={!one || p.busy} />
      <Tool icon="download" label="Unduh" onClick={p.onDownload} disabled={!p.hasFile || p.busy} />
      <Tool icon="trash" label="Hapus" hint="Delete" danger onClick={p.onDelete} disabled={!any || p.busy} />

      <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-blue-400/20 p-0.5">
        {(
          [
            ["detail", "list", "Tampilan daftar"],
            ["grid", "grid", "Tampilan ikon"],
          ] as const
        ).map(([mode, icon, label]) => (
          <button
            key={mode}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={p.view === mode}
            onClick={() => p.onView(mode)}
            className={`rounded-md p-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 ${
              p.view === mode
                ? "bg-linear-to-r from-blue-600 to-cyan-500 text-white"
                : "text-blue-100 hover:bg-blue-500/20 hover:text-cyan-200"
            }`}
          >
            <Icon name={icon} className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}