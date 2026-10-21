"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-2xl border border-blue-400/30 bg-[#06122a]/95 p-5 font-sans text-zinc-50 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
      >
        <h2 className="mb-4 text-base font-semibold text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}

const SECONDARY =
  "rounded-lg border border-blue-400/30 px-3.5 py-2 text-sm font-semibold text-blue-100 outline-none transition hover:border-cyan-300/60 hover:bg-blue-500/20 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50";

export function PromptDialog({
  title,
  label,
  initial = "",
  confirmText,
  selectBaseOnly,
  onSubmit,
  onClose,
}: {
  title: string;
  label: string;
  initial?: string;
  confirmText: string;
  selectBaseOnly?: boolean;
  /** Kembalikan teks error untuk menahan dialog, atau null jika berhasil */
  onSubmit: (value: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf(".");
    el.setSelectionRange(0, selectBaseOnly && dot > 0 ? dot : initial.length);
  }, [initial, selectBaseOnly]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const err = await onSubmit(value);
    setPending(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="block text-xs font-medium text-blue-100">
          {label}
          <input
            ref={input}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            className="mt-1.5 w-full rounded-lg border border-blue-400/30 bg-blue-950/60 px-3 py-2 text-sm text-blue-50 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/60"
          />
        </label>
        {error && (
          <p role="alert" className="mt-2 text-xs text-rose-300">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={SECONDARY}>
            Batal
          </button>
          <button
            type="submit"
            disabled={pending || !value.trim()}
            className="rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-3.5 py-2 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50"
          >
            {pending ? "Memproses…" : confirmText}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmText,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancel.current?.focus();
  }, []);

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-blue-100">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button ref={cancel} type="button" onClick={onClose} className={SECONDARY}>
          Batal
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await onConfirm();
            onClose();
          }}
          className="rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white outline-none transition hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-50"
        >
          {pending ? "Memproses…" : confirmText}
        </button>
      </div>
    </Modal>
  );
}