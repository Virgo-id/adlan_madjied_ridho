"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TaskPanel } from "./components/task/TaskPanel";
import { useTasks } from "./components/task/useTasks";

interface MenuItem {
  name: string;
  path: string;
  iconPath: string;
  shortcut: string;
}

const menuItems: MenuItem[] = [
  {
    name: "Beranda",
    path: "/admin",
    shortcut: "b",
    iconPath:
      "M3 10.75 12 3l9 7.75M5.25 9.5v10.25c0 .69.56 1.25 1.25 1.25h3.75v-5.5c0-.69.56-1.25 1.25-1.25h1c.69 0 1.25.56 1.25 1.25V21h3.75c.69 0 1.25-.56 1.25-1.25V9.5",
  },
  {
    name: "Karya Tulis",
    path: "/admin/karya-tulis",
    shortcut: "k",
    iconPath:
      "M14 2.75H6A2.25 2.25 0 0 0 3.75 5v14A2.25 2.25 0 0 0 6 21.25h12A2.25 2.25 0 0 0 20.25 19V9z M14 2.75V9h6.25 M7.5 13h9 M7.5 16.5h9 M7.5 9.5h2",
  },
  {
    name: "Website",
    path: "/admin/koleksi-website",
    shortcut: "w",
    iconPath:
      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3a15 15 0 0 1 0 18 M12 3a15 15 0 0 0 0 18",
  },
  {
    name: "Chat",
    path: "/admin/chat",
    shortcut: "c",
    iconPath:
      "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z",
  },
  {
    name: "Drive",
    path: "/admin/drive",
    shortcut: "d",
    iconPath:
      "M8.5 3h7l7 12.124-3.5 6.062H5l-3.5-6.062L8.5 3zm0 0 7 12.124m-13 0h20m-13 0-4.5 6.062m10.5-6.062 4.5 6.062",
  },
  {
    name: "Dokumen",
    path: "/admin/document",
    shortcut: "o",
    iconPath:
      "M7.5 3.75h9.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H7.5 M7.5 3.75v16.5 M4.75 8h5.5 M4.75 12h5.5 M4.75 16h5.5 M13 8.5h3 M13 12h3",
  },
];

// Tombol "Tugas" ada di taskbar, tetapi membuka panel (bukan pindah halaman)
const TUGAS = {
  key: "tugas",
  name: "Tugas",
  shortcut: "t",
  iconPath:
    "M9.5 6.5h10.75M9.5 12h10.75M9.5 17.5h10.75M3.75 6.5l1.5 1.5 2.75-3M3.75 12l1.5 1.5L8 10.5M3.75 17.5l1.5 1.5 2.75-3",
};

// Jumlah tombol taskbar yang bisa difokuskan: semua menu + tombol Tugas
const TOTAL_TOMBOL = menuItems.length + 1;

function Icon({
  d,
  className = "",
}: {
  d: string;
  className?: string;
}) {
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

/* Bagian taskbar yang dipakai bersama tombol menu dan tombol Tugas */

const kelasTombol = (active: boolean, isHovered: boolean) =>
  `group/icon relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl outline-none transition-[transform,background-color,box-shadow,color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-[58px] sm:w-[58px] ${
    isHovered
      ? "-translate-y-2 scale-110"
      : "hover:-translate-y-1 hover:scale-105"
  } ${
    active
      ? "bg-white/[0.12] text-white shadow-[0_0_24px_rgba(56,189,248,0.13)]"
      : "bg-transparent text-blue-100/75 hover:bg-white/[0.08] hover:text-white"
  }`;

function Tooltip({
  text,
  shortcut,
  show,
}: {
  text: string;
  shortcut: string;
  show: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute bottom-[calc(100%+14px)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/90 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-xl transition-all duration-200 ${
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      {text}

      <span className="ml-2 text-[10px] text-blue-300/70">
        {shortcut.toUpperCase()}
      </span>
    </div>
  );
}

function CahayaAktif({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-300/[0.10] to-blue-500/[0.04]"
    />
  );
}

function IndikatorAktif({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute -bottom-1 left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all duration-200 ${
        active
          ? "w-4 bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]"
          : "w-1 bg-transparent group-hover/icon:bg-white/40"
      }`}
    />
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  const [waktu, setWaktu] = useState("");
  const [loading, setLoading] = useState(true);
  const [pesanBaru, setPesanBaru] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Tugas dimuat setelah autentikasi selesai
  const tasks = useTasks(!loading);

  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>(
    []
  );
  const indeksTerakhir = useRef(0);

  const isActive = (path: string) =>
    path === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(path);

  // 1. Validasi autentikasi
  useEffect(() => {
    let aktif = true;

    const cekUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!aktif) return;

      if (!user) {
        router.replace("/loginadmin");
      } else {
        setLoading(false);
      }
    };

    void cekUser();

    return () => {
      aktif = false;
    };
  }, [router]);

  // 2. Jam digital
  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

    setWaktu(format());

    const interval = setInterval(() => {
      setWaktu(format());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 2b. Panel tugas: terbuka otomatis di layar lebar, tertutup di layar kecil
  useEffect(() => {
    setPanelOpen(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  // 3. Navigasi keyboard
  useEffect(() => {
    if (loading) return;

    const fokusKe = (index: number) => {
      const el = itemRefs.current[index];

      if (!el) return;

      indeksTerakhir.current = index;
      el.focus();
      el.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    };

    const tekan = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      const target = e.target as HTMLElement | null;

      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const keys = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];

      if (!keys.includes(e.key)) return;

      const total = TOTAL_TOMBOL;

      const sekarang = itemRefs.current.findIndex(
        (el) => el === document.activeElement
      );

      if (sekarang === -1) {
        e.preventDefault();
        fokusKe(indeksTerakhir.current);
        return;
      }

      let berikut = sekarang;

      switch (e.key) {
        case "ArrowRight":
          berikut = (sekarang + 1) % total;
          break;
        case "ArrowLeft":
          berikut = (sekarang - 1 + total) % total;
          break;
        case "ArrowDown":
        case "End":
          berikut = total - 1;
          break;
        case "ArrowUp":
        case "Home":
          berikut = 0;
          break;
      }

      e.preventDefault();
      fokusKe(berikut);
    };

    window.addEventListener("keydown", tekan);

    return () => {
      window.removeEventListener("keydown", tekan);
    };
  }, [loading]);

  // 4. Hitung pesan yang belum dibaca
  useEffect(() => {
    if (loading) return;

    let aktif = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const muatJumlah = async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("is_admin", false)
        .eq("is_read", false);

      if (aktif && !error) {
        setPesanBaru(count ?? 0);
      }
    };

    const jadwalkan = () => {
      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        void muatJumlah();
      }, 300);
    };

    void muatJumlah();

    const channel = supabase
      .channel("beranda-pesan-baru")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        jadwalkan
      )
      .subscribe();

    const saatTampil = () => {
      if (document.visibilityState === "visible") {
        void muatJumlah();
      }
    };

    document.addEventListener("visibilitychange", saatTampil);

    return () => {
      aktif = false;

      if (timer) clearTimeout(timer);

      document.removeEventListener(
        "visibilitychange",
        saatTampil
      );

      void supabase.removeChannel(channel);
    };
  }, [loading]);

  // 5. Shortcut huruf (T = buka/tutup panel tugas)
  useEffect(() => {
    if (loading) return;

    const tekan = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      const target = e.target as HTMLElement | null;

      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === TUGAS.shortcut) {
        e.preventDefault();
        setPanelOpen((v) => !v);
        return;
      }

      const item = menuItems.find((menu) => menu.shortcut === key);

      if (!item) return;

      e.preventDefault();
      router.push(item.path);
    };

    window.addEventListener("keydown", tekan);

    return () => {
      window.removeEventListener("keydown", tekan);
    };
  }, [loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans">
        <p className="animate-pulse text-xs font-bold uppercase tracking-[0.3em] text-blue-100">
          Memeriksa autentikasi...
        </p>
      </div>
    );
  }

  // Saat panel terbuka di layar lebar, area konten menyempit 22rem dari kanan,
  // jadi taskbar digeser setengahnya (11rem) agar tetap di tengah area konten.
  const posisiTaskbar = panelOpen
    ? "left-[calc(50%+36px)] max-w-[calc(100vw-88px)] lg:left-[calc(50%_+_36px_-_11rem)] lg:max-w-[calc(100vw_-_88px_-_22rem)]"
    : "left-[calc(50%+36px)] max-w-[calc(100vw-88px)]";

  const tugasHovered = hovered === TUGAS.key;

  return (
    <main
      className={`relative flex min-h-screen flex-col overflow-x-hidden font-sans text-white antialiased transition-[padding] duration-300 ${
        panelOpen ? "lg:pr-[22rem]" : ""
      }`}
    >
      {/* Efek cahaya dekoratif */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-[110px]" />

        <div className="absolute bottom-20 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-cyan-400/[0.05] blur-[100px]" />
      </div>

      {/* Jam digital */}
      <section className="flex w-full select-none flex-col items-center px-4 pt-[12vh] text-center sm:pt-[15vh]">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.45em] text-blue-200/60 sm:text-xs">
          Admin Workspace
        </p>

        <h1 className="font-mono text-7xl font-light tracking-[-0.07em] text-white drop-shadow-[0_0_30px_rgba(96,165,250,0.18)] sm:text-8xl md:text-9xl">
          {waktu || "00.00"}
        </h1>

        <p className="mt-5 text-sm font-medium tracking-wide text-blue-100/70 sm:text-base">
          Selamat datang kembali, Admin AMR.
        </p>
      </section>

      {/* Ruang kosong */}
      <div className="flex-1" />

      {/* Panel tugas di kanan (layar kecil: melayang di atas konten) */}
      {panelOpen && (
        <div className="fixed bottom-24 left-3 right-3 top-3 z-[60] lg:bottom-4 lg:left-auto lg:right-4 lg:top-4 lg:z-30 lg:w-80">
          <TaskPanel api={tasks} onClose={() => setPanelOpen(false)} />
        </div>
      )}

      {/* Taskbar transparan, tepat di tengah area konten */}
      <footer
        className={`fixed bottom-0 z-50 w-max -translate-x-1/2 pb-5 transition-[left,max-width] duration-300 sm:pb-7 ${posisiTaskbar}`}
        onMouseLeave={() => setHovered(null)}
      >
        <nav
          aria-label="Taskbar navigasi admin"
          className="flex w-max max-w-full flex-nowrap items-end justify-center gap-0.5 sm:gap-3"
        >
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            const jumlah =
              item.path === "/admin/chat" ? pesanBaru : 0;
            const isHovered = hovered === item.path;

            return (
              <div
                key={item.path}
                className="group relative flex shrink-0 flex-col items-center justify-end"
                onMouseEnter={() => setHovered(item.path)}
              >
                <Tooltip
                  text={item.name}
                  shortcut={item.shortcut}
                  show={isHovered}
                />

                {/* Tombol ikon */}
                <Link
                  href={item.path}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onFocus={() => {
                    indeksTerakhir.current = index;
                    setHovered(item.path);
                  }}
                  onBlur={() => setHovered(null)}
                  aria-current={active ? "page" : undefined}
                  aria-label={`${item.name}, shortcut ${item.shortcut.toUpperCase()}`}
                  title={item.name}
                  className={kelasTombol(active, isHovered)}
                >
                  <CahayaAktif active={active} />

                  <Icon
                    d={item.iconPath}
                    className={`relative z-10 h-6 w-6 sm:h-7 sm:w-7 ${
                      active
                        ? "drop-shadow-[0_0_8px_rgba(103,232,249,0.3)]"
                        : ""
                    }`}
                  />

                  {/* Badge pesan baru */}
                  {jumlah > 0 && (
                    <span
                      aria-label={`${jumlah} pesan belum dibaca`}
                      className="absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-950 bg-rose-500 px-1 text-[9px] font-bold leading-none text-white shadow-lg"
                    >
                      {jumlah > 99 ? "99+" : jumlah}
                    </span>
                  )}

                  <IndikatorAktif active={active} />
                </Link>
              </div>
            );
          })}

          {/* Tombol buka/tutup panel tugas */}
          <div
            className="group relative flex shrink-0 flex-col items-center justify-end"
            onMouseEnter={() => setHovered(TUGAS.key)}
          >
            <Tooltip
              text={TUGAS.name}
              shortcut={TUGAS.shortcut}
              show={tugasHovered}
            />

            <button
              type="button"
              ref={(el) => {
                itemRefs.current[menuItems.length] = el;
              }}
              onClick={() => setPanelOpen((v) => !v)}
              onFocus={() => {
                indeksTerakhir.current = menuItems.length;
                setHovered(TUGAS.key);
              }}
              onBlur={() => setHovered(null)}
              aria-pressed={panelOpen}
              aria-label={`${TUGAS.name}, shortcut ${TUGAS.shortcut.toUpperCase()}${
                tasks.activeCount > 0
                  ? `, ${tasks.activeCount} tugas aktif`
                  : ""
              }`}
              title={TUGAS.name}
              className={kelasTombol(panelOpen, tugasHovered)}
            >
              <CahayaAktif active={panelOpen} />

              <Icon
                d={TUGAS.iconPath}
                className={`relative z-10 h-6 w-6 sm:h-7 sm:w-7 ${
                  panelOpen
                    ? "drop-shadow-[0_0_8px_rgba(103,232,249,0.3)]"
                    : ""
                }`}
              />

              {/* Badge jumlah tugas aktif */}
              {tasks.activeCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-400 px-1 text-[9px] font-bold leading-none text-slate-950 shadow-lg"
                >
                  {tasks.activeCount > 99 ? "99+" : tasks.activeCount}
                </span>
              )}

              <IndikatorAktif active={panelOpen} />
            </button>
          </div>
        </nav>
      </footer>
    </main>
  );
}