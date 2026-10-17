"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/* ---------- Ikon SVG (gaya sama dengan halaman utama) ---------- */

type IkonProps = { className?: string };

function Ikon({
  className = "h-4 w-4",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconPanah({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Ikon>
  );
}

function IconKembali({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Ikon>
  );
}

function IconUser({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Ikon>
  );
}

function IconKunci({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Ikon>
  );
}

function IconMata({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Ikon>
  );
}

function IconMataTutup({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4" />
      <path d="M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </Ikon>
  );
}

function IconPeringatan({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <path d="M12 16.5h.01" />
    </Ikon>
  );
}

/* ---------- SVG dekoratif ---------- */

type JenisDekor = "cincin" | "titik" | "heksagon" | "garis";

function Dekor({
  jenis,
  className = "",
}: {
  jenis: JenisDekor;
  className?: string;
}) {
  const umum = {
    viewBox: "0 0 200 200",
    className: `pointer-events-none ${className}`,
    "aria-hidden": true,
  } as const;

  switch (jenis) {
    case "cincin":
      return (
        <svg {...umum} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="100" cy="100" r="30" />
          <circle cx="100" cy="100" r="60" />
          <circle cx="100" cy="100" r="90" />
        </svg>
      );

    case "titik":
      return (
        <svg {...umum} fill="currentColor">
          {[20, 60, 100, 140, 180].flatMap((x) =>
            [20, 60, 100, 140, 180].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" />
            ))
          )}
        </svg>
      );

    case "heksagon":
      return (
        <svg
          {...umum}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" />
          <polygon points="100,45 148,72 148,128 100,155 52,128 52,72" />
          <polygon points="100,80 118,90 118,110 100,120 82,110 82,90" fill="currentColor" />
        </svg>
      );

    case "garis":
      return (
        <svg
          {...umum}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path key={i} d={`M${i * 30 - 20} 220 L${i * 30 + 120} 80`} />
          ))}
        </svg>
      );
  }
}

const KELAS_INPUT =
  "w-full rounded-2xl border border-blue-400/20 bg-blue-950/60 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-blue-300/40 focus:border-cyan-300/70 disabled:opacity-60";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scrollbar biru gradasi, sama seperti halaman utama
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("scrollbar-biru");
    return () => html.classList.remove("scrollbar-biru");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const email = `${username}@adlanmadjiedridho.com`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage("Kredensial salah. Silakan coba lagi.");
      } else {
        window.location.href = "/admin";
      }
    } catch (err) {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040a16] p-4 font-sans text-zinc-50 antialiased [background-image:radial-gradient(rgba(96,165,250,0.12)_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Tombol Kembali ke Beranda */}
      <div className="absolute left-5 top-5 z-10 sm:left-8 sm:top-8">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-950/60 px-4 py-2 text-xs font-semibold text-blue-200 transition duration-200 hover:border-cyan-300/60 hover:text-cyan-200 active:scale-95"
        >
          <IconKembali className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Kembali ke Beranda
        </Link>
      </div>

      {/* Glow latar belakang */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 select-none rounded-full bg-blue-500/15 blur-[120px]" />

      {/* Kartu form */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950 animate-in fade-in zoom-in-95 duration-200">
        {/* Kepala */}
        <div className="relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400 px-6 pb-7 pt-6">
          <Dekor
            jenis="cincin"
            className="absolute -right-14 -top-14 h-52 w-52 text-white/20"
          />
          <Dekor
            jenis="titik"
            className="absolute -bottom-8 left-4 h-24 w-24 text-white/15"
          />
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
              <IconKunci className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-2xl font-black text-white">Admin Area</h1>
            <p className="mt-1 text-sm text-blue-50/90">
              Silakan masuk untuk mengelola dashboard chat.
            </p>
          </div>
        </div>

        {/* Isi */}
        <div className="relative p-6">
          <Dekor
            jenis="garis"
            className="absolute -bottom-10 -right-10 h-44 w-44 text-blue-400/10"
          />

          <form onSubmit={handleLogin} className="relative space-y-3">
            {/* Username */}
            <div className="relative">
              <IconUser className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/70" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={KELAS_INPUT}
                placeholder="Username"
                autoComplete="username"
                required
                disabled={loading}
                autoFocus
                suppressHydrationWarning
              />
            </div>

            {/* Password */}
            <div className="relative">
              <IconKunci className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/70" />
              <input
                type={lihat ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${KELAS_INPUT} pr-12`}
                placeholder="Password"
                autoComplete="current-password"
                required
                disabled={loading}
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setLihat((v) => !v)}
                aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-blue-300/70 transition hover:text-cyan-300 active:scale-90"
              >
                {lihat ? <IconMataTutup /> : <IconMata />}
              </button>
            </div>

            {/* Pesan error */}
            {errorMessage && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-2xl bg-blue-500/10 px-4 py-3 text-xs font-semibold text-sky-200 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <IconPeringatan className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}

            {/* Tombol submit */}
            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white transition duration-200 ease-out hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 active:scale-95 active:from-blue-700 active:to-cyan-600 disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
              {!loading && <IconPanah />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}