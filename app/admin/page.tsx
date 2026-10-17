"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface MenuItem {
  name: string;
  path: string;
  iconPath: string; // atribut "d" dari SVG
}

// Sama dengan menu di Sidebar
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

const KEY_NAVIGASI = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
];

function Icon({ d, className = "" }: { d: string; className?: string }) {
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
      <path d={d} />
    </svg>
  );
}

/* Tampilan tombol keyboard kecil untuk petunjuk */
function Tombol({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-blue-300/30 bg-blue-950/60 px-1 py-px font-sans text-[9px] font-bold leading-none text-blue-100">
      {children}
    </kbd>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [waktu, setWaktu] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const indeksTerakhir = useRef(0);

  // "/admin" harus persis sama, menu lain aktif juga untuk sub-halamannya
  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

  // 1. ENGINE VALIDASI: Tendang user kalau ga login
  useEffect(() => {
    const cekUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/loginadmin");
      } else {
        setLoading(false);
      }
    };

    cekUser();
  }, [router]);

  // 2. ENGINE JAM DIGITAL: tanpa detik, cukup jam dan menit
  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

    setWaktu(format());
    // Tanpa detik, cek tiap 5 detik sudah cukup agar menit selalu tepat
    const interval = setInterval(() => setWaktu(format()), 5000);

    return () => clearInterval(interval);
  }, []);

  // 3. NAVIGASI KEYBOARD: panah memindah fokus, Enter membuka (bawaan Link)
  useEffect(() => {
    if (loading) return;

    const fokusKe = (i: number) => {
      const el = itemRefs.current[i];
      if (!el) return;
      indeksTerakhir.current = i;
      el.focus();
      el.scrollIntoView({ block: "nearest" });
    };

    // Jumlah kolom grid saat ini (2 di mobile, 4 di layar sm ke atas)
    const hitungKolom = () => {
      const daftar = itemRefs.current.filter(
        (el): el is HTMLAnchorElement => el !== null
      );
      if (daftar.length === 0) return 1;
      const atas = daftar[0].offsetTop;
      let kolom = 0;
      for (const el of daftar) {
        if (el.offsetTop === atas) kolom++;
        else break;
      }
      return kolom || 1;
    };

    const tekan = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (!KEY_NAVIGASI.includes(e.key)) return;

      // Jangan ganggu kolom isian / elemen yang bisa diedit
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const total = menuItems.length;
      const sekarang = itemRefs.current.findIndex(
        (el) => el === document.activeElement
      );

      // Belum ada yang terfokus: panah pertama masuk ke tombol terakhir/aktif
      if (sekarang === -1) {
        e.preventDefault();
        const awal = indeksTerakhir.current;
        fokusKe(awal >= 0 && awal < total ? awal : 0);
        return;
      }

      const kolom = hitungKolom();
      let berikut = sekarang;

      switch (e.key) {
        case "ArrowRight":
          berikut = (sekarang + 1) % total;
          break;
        case "ArrowLeft":
          berikut = (sekarang - 1 + total) % total;
          break;
        case "ArrowDown":
          berikut =
            sekarang + kolom < total ? sekarang + kolom : sekarang % kolom;
          break;
        case "ArrowUp": {
          if (sekarang - kolom >= 0) {
            berikut = sekarang - kolom;
          } else {
            // Loncat ke baris paling bawah di kolom yang sama
            const barisAkhir = Math.floor((total - 1) / kolom);
            berikut = Math.min(barisAkhir * kolom + (sekarang % kolom), total - 1);
          }
          break;
        }
        case "Home":
          berikut = 0;
          break;
        case "End":
          berikut = total - 1;
          break;
      }

      e.preventDefault();
      fokusKe(berikut);
    };

    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-blue-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Memeriksa Autentikasi...
        </div>
      </div>
    );
  }

  // 4. TAMPILAN UTAMA (tanpa background, gambar dari layout terlihat penuh)
  return (
    <div className="relative flex min-h-screen flex-col px-5 font-sans text-zinc-50 antialiased">
      {/* Jam di bagian atas halaman */}
      <div className="flex select-none flex-col items-center pt-10 text-center sm:pt-14">
        <h1 className="font-mono text-6xl font-light tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-7xl md:text-8xl">
          {waktu || "00.00"}
        </h1>
        <p className="mt-3 text-sm font-medium text-blue-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-base">
          Selamat datang kembali, Admin AMR.
        </p>
      </div>

      {/* Pengisi ruang: mendorong menu ke bagian bawah halaman */}
      <div className="flex-1" />

      {/* Tombol menu di bagian bawah halaman */}
      <nav
        aria-label="Pintasan menu admin"
        className="mx-auto w-full max-w-2xl pb-28 md:pb-10"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {menuItems.map((item, i) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onFocus={() => {
                  indeksTerakhir.current = i;
                }}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-semibold outline-none backdrop-blur-sm transition duration-200 ease-out hover:scale-[1.03] active:scale-95 focus-visible:scale-105 focus-visible:border-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040a16] focus-visible:shadow-[0_0_24px_rgba(56,189,248,0.5)] ${
                  active
                    ? "border-transparent bg-linear-to-r from-blue-600 to-cyan-500 text-white"
                    : "border-blue-400/30 bg-blue-950/40 text-blue-100 hover:border-cyan-300/60 hover:bg-blue-500/20 hover:text-cyan-200 focus-visible:bg-blue-500/30 focus-visible:text-cyan-100"
                }`}
              >
                <Icon d={item.iconPath} className="h-6 w-6" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Petunjuk keyboard: kecil, pojok kanan bawah (hanya layar md ke atas) */}
      <p
        aria-hidden="true"
        className="pointer-events-none fixed bottom-4 right-5 z-20 hidden select-none items-center gap-1 text-[10px] font-medium text-blue-100/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] md:flex"
      >
        <Tombol>←</Tombol>
        <Tombol>↑</Tombol>
        <Tombol>↓</Tombol>
        <Tombol>→</Tombol>
        <span className="ml-0.5">pilih</span>
        <span className="mx-0.5">·</span>
        <Tombol>Enter</Tombol>
        <span className="ml-0.5">buka</span>
      </p>
    </div>
  );
}