// src/components/Sidebar.tsx (atau sesuaikan dengan path folder Anda)
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface MenuItem {
  name: string;
  path: string;
  iconPath: string; // atribut "d" dari SVG
}

interface SidebarProps {
  hideMobile?: boolean;
}

interface Pengguna {
  id: string;
  nama: string;
  email: string;
  avatar: string | null;
}

const menuItems: MenuItem[] = [
  {
    name: "Beranda",
    path: "/admin",
    iconPath:
      "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  },
  {
    name: "Karya Tulis",
    path: "/admin/karya-tulis",
    iconPath:
      "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  },
  {
    name: "Website",
    path: "/admin/koleksi-website",
    iconPath:
      "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
  },
  {
    name: "Chat",
    path: "/admin/chat",
    iconPath:
      "M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
  },
];

// Ikon tambahan
const IKON_KEMBALI = ["M19 12H5", "m11 6-6 6 6 6"];
const IKON_LOGOUT = [
  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
  "m16 17 5-5-5-5",
  "M21 12H9",
];
const IKON_MENU = ["M4 6h16", "M4 12h16", "M4 18h16"];
const IKON_TUTUP = ["M18 6 6 18", "m6 6 12 12"];

function Icon({
  d,
  className = "",
}: {
  d: string | string[];
  className?: string;
}) {
  const daftar = Array.isArray(d) ? d : [d];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {daftar.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

/* Dekorasi cincin, sama seperti di halaman utama */
function Cincin({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    >
      <circle cx="100" cy="100" r="30" />
      <circle cx="100" cy="100" r="60" />
      <circle cx="100" cy="100" r="90" />
    </svg>
  );
}

/* Logo brand (gambar ikon) */
function LogoBrand({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/icon/icon-192x192.png"
      alt=""
      width={44}
      height={44}
      priority
      className={`h-11 w-11 shrink-0 object-contain ${className}`}
    />
  );
}

/* ---------- Sesi pengguna ---------- */

function ambilPengguna(session: Session | null): Pengguna | null {
  const user = session?.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const email = user.email ?? "";
  return {
    id: user.id,
    nama: meta.full_name || meta.name || email.split("@")[0] || "Admin",
    email,
    avatar: meta.avatar_url || meta.picture || null,
  };
}

function useSesi() {
  const [pengguna, setPengguna] = useState<Pengguna | null>(null);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    let aktif = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!aktif) return;
      setPengguna(ambilPengguna(data.session));
      setSiap(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setPengguna(ambilPengguna(session));
      setSiap(true);
    });

    return () => {
      aktif = false;
      subscription.unsubscribe();
    };
  }, []);

  return { pengguna, siap };
}

function Avatar({
  pengguna,
  ukuran,
}: {
  pengguna: Pengguna;
  ukuran: string;
}) {
  const inisial = pengguna.nama.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-blue-500 to-cyan-400 font-bold text-white ${ukuran}`}
    >
      {pengguna.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pengguna.avatar}
          alt={pengguna.nama}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        inisial
      )}
    </span>
  );
}

/* ---------- Card profil ---------- */

function CardProfil({
  pengguna,
  siap,
  onLogout,
  onNavigasi,
  sibuk,
  tampilTeks,
}: {
  pengguna: Pengguna | null;
  siap: boolean;
  onLogout: () => void;
  onNavigasi?: () => void;
  sibuk: boolean;
  /** Desktop: teks hanya muncul saat sidebar di-hover. Mobile: selalu tampil. */
  tampilTeks: "hover" | "selalu";
}) {
  const kelasTeks =
    tampilTeks === "hover"
      ? "opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      : "";

  if (!siap) {
    return <div className="h-24 animate-pulse rounded-2xl bg-blue-900/30" />;
  }

  if (!pengguna) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-linear-to-br from-blue-700/40 to-blue-950/60 p-1.5">
      <Cincin className="absolute -right-8 -top-8 h-24 w-24 text-white/10" />

      {/* Identitas */}
      <div className="relative flex items-center gap-3">
        <Avatar pengguna={pengguna} ukuran="h-9 w-9 text-sm" />
        <div className={`min-w-0 overflow-hidden whitespace-nowrap ${kelasTeks}`}>
          <p className="truncate text-sm font-bold leading-tight text-white">
            {pengguna.nama}
          </p>
          <p className="truncate text-[11px] text-blue-200/80">
            {pengguna.email}
          </p>
        </div>
      </div>

      {/* Tombol */}
      <div className="relative mt-1.5 flex flex-col gap-1">
        <Link
          href="/"
          title="Kembali ke Beranda"
          onClick={onNavigasi}
          className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-blue-100 outline-none transition duration-200 hover:bg-blue-500/20 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300/70 active:scale-95"
        >
          <Icon d={IKON_KEMBALI} className="h-5 w-5 shrink-0" />
          <span className={`overflow-hidden whitespace-nowrap ${kelasTeks}`}>
            Kembali ke Beranda
          </span>
        </Link>

        <button
          onClick={onLogout}
          disabled={sibuk}
          title="Logout"
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-semibold text-blue-100 outline-none transition duration-200 hover:bg-blue-500/20 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300/70 active:scale-95 disabled:cursor-wait disabled:opacity-60"
        >
          <Icon d={IKON_LOGOUT} className="h-5 w-5 shrink-0" />
          <span className={`overflow-hidden whitespace-nowrap ${kelasTeks}`}>
            {sibuk ? "Keluar..." : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ hideMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { pengguna, siap } = useSesi();
  const [sibuk, setSibuk] = useState(false);
  const [terbuka, setTerbuka] = useState(false);

  // "/admin" harus persis sama, menu lain aktif juga untuk sub-halamannya
  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

  const tutup = () => setTerbuka(false);

  // Mobile: tutup dengan Escape + kunci scroll halaman saat sidebar terbuka
  useEffect(() => {
    if (!terbuka) return;

    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTerbuka(false);
    };
    document.addEventListener("keydown", tekan);
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", tekan);
      document.body.style.overflow = overflowLama;
    };
  }, [terbuka]);

  // Jika hideMobile aktif, pastikan drawer tertutup
  useEffect(() => {
    if (hideMobile) setTerbuka(false);
  }, [hideMobile]);

  const logout = async () => {
    setSibuk(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setSibuk(false);
      setTerbuka(false);
      router.push("/");
    }
  };

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="group fixed left-0 top-0 z-50 hidden h-screen w-[4.5rem] flex-col justify-center overflow-hidden border-r border-blue-400/20 bg-linear-to-b from-blue-950 to-zinc-950 antialiased transition-[width] duration-200 ease-in-out hover:w-60 md:flex">
        <Cincin className="absolute -left-16 -top-16 h-56 w-56 text-blue-400/10" />

        {/* Logo */}
        <div className="absolute left-0 top-0 flex h-20 w-full items-center gap-3 px-3">
          <LogoBrand />
          <span className="overflow-hidden whitespace-nowrap text-lg font-black tracking-widest text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            AMR
          </span>
        </div>

        <nav
          className="relative flex w-full flex-col gap-2 px-3"
          aria-label="Menu admin"
        >
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                title={item.name}
                className={`flex items-center gap-4 rounded-2xl px-3 py-3 text-sm font-semibold outline-none transition duration-200 ease-out focus-visible:ring-2 focus-visible:ring-cyan-300/70 active:scale-95 ${
                  active
                    ? "bg-linear-to-r from-blue-600 to-cyan-500 text-white"
                    : "text-blue-200/80 hover:bg-blue-500/15 hover:text-cyan-200"
                }`}
              >
                <Icon d={item.iconPath} className="h-5 w-5 shrink-0" />
                <span className="overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Card profil */}
        <div className="absolute bottom-0 left-0 w-full px-3 pb-3">
          <CardProfil
            pengguna={pengguna}
            siap={siap}
            onLogout={logout}
            sibuk={sibuk}
            tampilTeks="hover"
          />
        </div>
      </aside>

      {/* 2. MOBILE: tombol menu di pojok kanan bawah */}
      {!hideMobile && (
        <button
          onClick={() => setTerbuka(true)}
          aria-label="Buka menu"
          aria-haspopup="dialog"
          aria-expanded={terbuka}
          className={`fixed bottom-5 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] transition duration-200 ease-out hover:from-blue-500 hover:to-cyan-400 active:scale-90 active:from-blue-700 active:to-cyan-600 md:hidden ${
            terbuka ? "invisible" : ""
          }`}
        >
          <Icon d={IKON_MENU} className="h-6 w-6" />
        </button>
      )}

      {/* 3. MOBILE: sidebar (drawer dari kiri) */}
      {!hideMobile && (
        <div
          className={`fixed inset-0 z-50 md:hidden ${
            terbuka ? "" : "pointer-events-none"
          }`}
          aria-hidden={!terbuka}
        >
          {/* Overlay */}
          <button
            tabIndex={terbuka ? 0 : -1}
            aria-label="Tutup menu"
            onClick={tutup}
            className={`absolute inset-0 cursor-default bg-black/60 transition-opacity duration-200 ${
              terbuka ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu admin"
            className={`absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-hidden border-r border-blue-400/20 bg-linear-to-b from-blue-950 to-zinc-950 antialiased transition-transform duration-200 ease-out ${
              terbuka ? "translate-x-0" : "-translate-x-full"
            } ${terbuka ? "" : "invisible"}`}
          >
            <Cincin className="absolute -left-16 -top-16 h-56 w-56 text-blue-400/10" />

            {/* Logo + tombol tutup */}
            <div className="relative flex h-20 shrink-0 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <LogoBrand />
                <span className="text-lg font-black tracking-widest text-white">
                  AMR
                </span>
              </div>
              <button
                onClick={tutup}
                aria-label="Tutup menu"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-500/15 text-blue-200 transition duration-200 hover:bg-blue-500/25 hover:text-cyan-200 active:scale-90"
              >
                <Icon d={IKON_TUTUP} className="h-5 w-5" />
              </button>
            </div>

            {/* Menu */}
            <nav
              className="scrollbar-biru relative flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2"
              aria-label="Menu admin"
            >
              {menuItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={active ? "page" : undefined}
                    onClick={tutup}
                    className={`flex items-center gap-4 rounded-2xl px-3 py-3 text-sm font-semibold outline-none transition duration-200 ease-out focus-visible:ring-2 focus-visible:ring-cyan-300/70 active:scale-95 ${
                      active
                        ? "bg-linear-to-r from-blue-600 to-cyan-500 text-white"
                        : "text-blue-200/80 hover:bg-blue-500/15 hover:text-cyan-200"
                    }`}
                  >
                    <Icon d={item.iconPath} className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Card profil */}
            <div className="relative shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
              <CardProfil
                pengguna={pengguna}
                siap={siap}
                onLogout={logout}
                onNavigasi={tutup}
                sibuk={sibuk}
                tampilTeks="selalu"
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}