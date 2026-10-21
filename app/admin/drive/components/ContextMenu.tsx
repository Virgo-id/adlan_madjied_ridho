import { useEffect, useRef } from "react";
import { Icon, type IconName } from "./Icon";

export type MenuEntry =
  | "sep"
  | {
      label: string;
      icon: IconName;
      onClick: () => void;
      danger?: boolean;
      disabled?: boolean;
    };

export function ContextMenu({
  x,
  y,
  entries,
  onClose,
}: {
  x: number;
  y: number;
  entries: MenuEntry[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    window.addEventListener("blur", onClose);
    window.addEventListener("scroll", onClose, true);
    ref.current?.querySelector("button")?.focus();
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  const height = entries.reduce((h, e) => h + (e === "sep" ? 9 : 34), 12);
  const left = Math.max(8, Math.min(x, window.innerWidth - 216));
  const top = Math.max(8, Math.min(y, window.innerHeight - height - 8));

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left, top }}
      className="fixed z-50 w-52 rounded-xl border border-blue-400/30 bg-[#06122a]/95 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {entries.map((e, i) =>
        e === "sep" ? (
          <div key={`sep-${i}`} role="separator" className="my-1 h-px bg-blue-400/20" />
        ) : (
          <button
            key={e.label}
            type="button"
            role="menuitem"
            disabled={e.disabled}
            onClick={() => {
              onClose();
              e.onClick();
            }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm outline-none transition disabled:pointer-events-none disabled:opacity-40 ${
              e.danger
                ? "text-rose-200 hover:bg-rose-500/20 focus-visible:bg-rose-500/20"
                : "text-blue-100 hover:bg-blue-500/20 hover:text-cyan-200 focus-visible:bg-blue-500/30 focus-visible:text-cyan-100"
            }`}
          >
            <Icon name={e.icon} className="h-4 w-4" />
            {e.label}
          </button>
        )
      )}
    </div>
  );
}