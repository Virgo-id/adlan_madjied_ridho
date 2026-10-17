"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import ChatModal, { CHAT_REOPEN_KEY } from "./components/chat/ChatModal";

const JUMLAH_KARYA = 4;
const DOMAIN_EMAIL = "@adlanmadjiedridho.com";

interface Post {
  id: string;
  created_at: string | null;
  title: string;
  slug: string | null;
  category: string | null;
  status: string | null;
  summary: string | null;
  cover_url: string | null;
}

interface Pengguna {
  id: string;
  nama: string;
  email: string;
  avatar: string | null;
}

const WARNA_KARTU = [
  "from-blue-600 to-cyan-400",
  "from-sky-500 to-blue-700",
  "from-cyan-500 to-blue-600",
  "from-blue-800 to-sky-500",
];

const RIWAYAT_JABATAN = [
  { jabatan: "Sekretaris", tempat: "Perpustakaan Lubangsa", saatIni: true },
  { jabatan: "Basis Data & Inventaris", tempat: "Perpustakaan Lubangsa", saatIni: false },
];

const RIWAYAT_PENDIDIKAN = [
  "Taman Kanak-kanak",
  "MI Nurul Mannan",
  "MTs Nurul Mannan",
  "MA 1 Annuqayah",
  "Universitas Annuqayah",
];

function ambilPengguna(session: Session | null): Pengguna | null {
  const user = session?.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const email = user.email ?? "";
  return {
    id: user.id,
    nama: meta.full_name || meta.name || email.split("@")[0] || "Pengguna",
    email,
    avatar: meta.avatar_url || meta.picture || null,
  };
}

function terjemahPesan(pesan: string): string {
  const p = pesan.toLowerCase();
  if (p.includes("invalid login credentials")) return "Username atau password salah.";
  if (p.includes("email not confirmed")) return "Akun belum dikonfirmasi. Hubungi admin.";
  if (p.includes("password should be at least")) return "Password minimal 6 karakter.";
  if (p.includes("invalid email") || p.includes("unable to validate email"))
    return "Format username tidak valid.";
  if (p.includes("rate limit") || p.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  if (p.includes("failed to fetch") || p.includes("network"))
    return "Koneksi bermasalah. Periksa internet kamu.";
  return "Terjadi kesalahan. Silakan coba lagi.";
}

/* ---------- Status login (dipakai header & kartu chat) ---------- */

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

/* ---------- Jumlah pesan baru (balasan admin yang belum dibaca) ---------- */

function usePesanBaru(userId: string | undefined, chatOpen: boolean) {
  const [jumlah, setJumlah] = useState(0);

  const hitung = useCallback(async () => {
    if (!userId) {
      setJumlah(0);
      return;
    }
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", userId)
      .eq("is_admin", true)
      .eq("is_read", false);

    if (!error) setJumlah(count ?? 0);
  }, [userId]);

  // Hitung awal + pantau perubahan secara realtime
  useEffect(() => {
    void hitung();
    if (!userId) return;

    const channel = supabase
      .channel(`pesan-baru-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => {
          void hitung();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, hitung]);

  // Hitung ulang setiap chat ditutup (pesan sudah ditandai terbaca di dalam chat)
  useEffect(() => {
    if (!chatOpen) void hitung();
  }, [chatOpen, hitung]);

  return userId ? jumlah : 0;
}

/* ---------- Ikon SVG ---------- */

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

function IconChat({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    </Ikon>
  );
}

function IconPen({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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

function IconBriefcase({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </Ikon>
  );
}

function IconCap({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="m2 9 10-5 10 5-10 5Z" />
      <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />
    </Ikon>
  );
}

function IconLogin({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </Ikon>
  );
}

function IconLogout({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Ikon>
  );
}

function IconChevron({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Ikon>
  );
}

function IconClose({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
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

function IconGoogle({ className }: IkonProps) {
  return (
    <Ikon className={className}>
      <path d="M18.4 6.6A8.5 8.5 0 1 0 20.5 12" />
      <path d="M20.5 12h-8" />
    </Ikon>
  );
}

/* ---------- SVG dekoratif (bervariasi) ---------- */

type JenisDekor =
  | "cincin"
  | "gelombang"
  | "titik"
  | "segitiga"
  | "bintang"
  | "heksagon"
  | "garis"
  | "lengkung";

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

    case "gelombang":
      return (
        <svg
          {...umum}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {[40, 80, 120, 160].map((y) => (
            <path key={y} d={`M0 ${y} Q25 ${y - 30} 50 ${y} T100 ${y} T150 ${y} T200 ${y}`} />
          ))}
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

    case "segitiga":
      return (
        <svg
          {...umum}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <polygon points="100,15 185,165 15,165" />
          <polygon points="100,55 150,145 50,145" />
          <polygon points="100,95 118,127 82,127" fill="currentColor" />
        </svg>
      );

    case "bintang":
      return (
        <svg {...umum} fill="currentColor">
          <path d="M100 10 C105 70 130 95 190 100 C130 105 105 130 100 190 C95 130 70 105 10 100 C70 95 95 70 100 10Z" />
          <path
            d="M40 20 C42 35 48 40 60 42 C48 44 42 49 40 64 C38 49 32 44 20 42 C32 40 38 35 40 20Z"
            opacity="0.7"
          />
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

    case "lengkung":
      return (
        <svg
          {...umum}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M20 200 A180 180 0 0 1 200 20" />
          <path d="M60 200 A140 140 0 0 1 200 60" />
          <path d="M100 200 A100 100 0 0 1 200 100" />
          <path d="M140 200 A60 60 0 0 1 200 140" />
        </svg>
      );
  }
}

function JudulSeksi({
  ikon,
  children,
}: {
  ikon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-cyan-400 text-white">
        {ikon}
      </span>
      <h2 className="text-sm font-bold uppercase tracking-widest text-blue-200">
        {children}
      </h2>
    </div>
  );
}

/* ---------- Modal login (Google + username) ---------- */

const KELAS_INPUT =
  "w-full rounded-2xl border border-blue-400/20 bg-blue-950/60 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-blue-300/40 focus:border-cyan-300/70 disabled:opacity-60";

// Ambil bagian username saja (buang spasi dan apa pun setelah "@")
function bersihkanUsername(nilai: string): string {
  return nilai.trim().toLowerCase().split("@")[0].replace(/\s+/g, "");
}

function ModalLogin({ onTutup }: { onTutup: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    document.addEventListener("keydown", tekan);
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tekan);
      document.body.style.overflow = overflowLama;
    };
  }, [onTutup]);

  const masukGoogle = async () => {
    setError(null);
    setSibuk(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) {
      console.error("Gagal login Google:", err);
      setError(terjemahPesan(err.message));
      setSibuk(false);
    }
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const namaPengguna = bersihkanUsername(username);

    if (!namaPengguna) {
      setError("Isi username dengan benar.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setSibuk(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: `${namaPengguna}${DOMAIN_EMAIL}`,
        password,
      });
      if (err) throw err;
    } catch (err) {
      console.error("Gagal autentikasi:", err);
      setError(terjemahPesan(err instanceof Error ? err.message : String(err)));
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Masuk"
        className="scrollbar-biru relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950"
      >
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
          <button
            onClick={onTutup}
            aria-label="Tutup"
            className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition duration-200 hover:scale-110 hover:bg-white/30 active:scale-90"
          >
            <IconClose />
          </button>
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
              <IconUser className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-2xl font-black text-white">
              Selamat datang
            </h2>
            <p className="mt-1 text-sm text-blue-50/90">
              Masuk untuk mulai mengobrol dengan saya.
            </p>
          </div>
        </div>

        {/* Isi */}
        <div className="space-y-5 p-6">
          <button
            onClick={masukGoogle}
            disabled={sibuk}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition duration-200 ease-out hover:scale-[1.02] hover:border-cyan-300/60 hover:bg-blue-500/20 active:scale-95 disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
          >
            <IconGoogle className="h-5 w-5" />
            Lanjut dengan Google
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-blue-400/20" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/60">
              atau dengan username
            </span>
            <span className="h-px flex-1 bg-blue-400/20" />
          </div>

          <form onSubmit={kirim} className="space-y-3">
            <div className="relative">
              <IconUser className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/70" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                disabled={sibuk}
                className={`${KELAS_INPUT} pr-44`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-300/60">
                {DOMAIN_EMAIL}
              </span>
            </div>

            <div className="relative">
              <IconKunci className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/70" />
              <input
                type={lihat ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 karakter)"
                autoComplete="current-password"
                required
                disabled={sibuk}
                className={`${KELAS_INPUT} pr-12`}
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

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-blue-500/10 px-4 py-3 text-xs font-semibold text-sky-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sibuk}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white transition duration-200 ease-out hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 active:scale-95 active:from-blue-700 active:to-cyan-600 disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
            >
              {sibuk ? "Memproses..." : "Masuk"}
              {!sibuk && <IconPanah />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------- Header: login / profil ---------- */

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

function AkunMenu({
  pengguna,
  siap,
  onMasuk,
}: {
  pengguna: Pengguna | null;
  siap: boolean;
  onMasuk: () => void;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const wadahRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!terbuka) return;

    const klikLuar = (e: MouseEvent) => {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) {
        setTerbuka(false);
      }
    };
    const tekanTombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTerbuka(false);
    };

    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekanTombol);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekanTombol);
    };
  }, [terbuka]);

  const keluar = async () => {
    setSibuk(true);
    await supabase.auth.signOut();
    setSibuk(false);
    setTerbuka(false);
  };

  if (!siap) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-blue-900/40" />;
  }

  if (!pengguna) {
    return (
      <button
        onClick={onMasuk}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 ease-out hover:scale-105 hover:from-blue-500 hover:to-cyan-400 active:scale-95 active:from-blue-700 active:to-cyan-600"
      >
        <IconLogin />
        Login
      </button>
    );
  }

  return (
    <div ref={wadahRef} className="relative">
      <button
        onClick={() => setTerbuka((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={terbuka}
        aria-label="Menu akun"
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-950/60 p-1 pr-2.5 text-blue-200 transition duration-200 hover:scale-105 hover:border-cyan-300/60 active:scale-95"
      >
        <Avatar pengguna={pengguna} ukuran="h-9 w-9 text-sm" />
        <IconChevron
          className={`h-4 w-4 transition-transform duration-200 ${
            terbuka ? "rotate-180" : ""
          }`}
        />
      </button>

      {terbuka && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-3xl border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950 p-2"
        >
          <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-linear-to-br from-blue-700 to-cyan-500 p-3">
            <Dekor
              jenis="cincin"
              className="absolute -right-8 -top-8 h-24 w-24 text-white/20"
            />
            <Avatar pengguna={pengguna} ukuran="h-11 w-11 text-base" />
            <div className="relative min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {pengguna.nama}
              </p>
              <p className="truncate text-[11px] text-blue-50/80">
                {pengguna.email}
              </p>
            </div>
          </div>

          <button
            role="menuitem"
            onClick={keluar}
            disabled={sibuk}
            className="mt-2 flex w-full cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15 active:bg-blue-500/25 disabled:cursor-wait disabled:opacity-60"
          >
            <IconLogout />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function Header({
  pengguna,
  siap,
  onMasuk,
}: {
  pengguna: Pengguna | null;
  siap: boolean;
  onMasuk: () => void;
}) {
  return (
    <header className="relative z-30 mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-5">
      <Link
        href="/"
        aria-label="AMR - Beranda"
        className="flex items-center gap-2.5 text-lg font-black tracking-widest text-white transition duration-200 hover:opacity-90 active:scale-95"
      >
        <Image
          src="/icon/icon-192x192.png"
          alt=""
          width={36}
          height={36}
          priority
          className="h-9 w-9 shrink-0 object-contain"
        />
        AMR
      </Link>
      <AkunMenu pengguna={pengguna} siap={siap} onMasuk={onMasuk} />
    </header>
  );
}

/* ---------- Tombol Hubungi Saya (mengambang) ---------- */

function TombolHubungi({
  onOpenChat,
  tersembunyi,
  jumlahBaru,
}: {
  onOpenChat: () => void;
  tersembunyi: boolean;
  jumlahBaru: number;
}) {
  const [melebar, setMelebar] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMelebar(false), 4800);
    return () => clearTimeout(timer);
  }, []);

  const adaPesanBaru = jumlahBaru > 0;
  const teksJumlah = jumlahBaru > 99 ? "99+" : String(jumlahBaru);

  return (
    <>
      <style>{`
        @keyframes fab-masuk {
          from { opacity: 0; transform: translateY(28px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fab-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.55); }
          100% { box-shadow: 0 0 0 16px rgba(56, 189, 248, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fab-hubungi { animation: none !important; }
        }
      `}</style>

      <button
        onClick={onOpenChat}
        aria-label={
          adaPesanBaru ? `Ada ${jumlahBaru} pesan baru` : "Hubungi Saya"
        }
        style={{
          animation: adaPesanBaru
            ? "fab-pulse 1.5s ease-out infinite"
            : "fab-masuk 0.6s ease-out backwards, fab-pulse 1.2s ease-out 0.7s 3",
        }}
        className={`fab-hubungi group fixed bottom-5 right-5 z-40 flex h-14 min-w-14 cursor-pointer items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-cyan-500 px-4 text-white transition duration-200 ease-out hover:scale-110 hover:from-blue-500 hover:to-cyan-400 active:scale-90 active:from-blue-700 active:to-cyan-600 sm:bottom-7 sm:right-7 ${
          tersembunyi ? "invisible" : ""
        }`}
      >
        <IconChat className="h-6 w-6 shrink-0" />

        {adaPesanBaru ? (
          <span className="flex max-w-64 items-center overflow-hidden whitespace-nowrap opacity-100 transition-all duration-500 ease-in-out">
            <span className="block pl-2.5 text-sm font-semibold">
              Ada pesan baru
            </span>
            <span className="ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-black text-blue-700">
              {teksJumlah}
            </span>
          </span>
        ) : (
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out ${
              melebar
                ? "max-w-40 opacity-100"
                : "max-w-0 opacity-0 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:opacity-100"
            }`}
          >
            <span className="block pl-2.5 text-sm font-semibold">
              Hubungi Saya
            </span>
          </span>
        )}
      </button>
    </>
  );
}

/* ---------- Kartu bagian atas (bento) ---------- */

function KartuHero() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400 p-6 sm:p-8 md:col-span-4 md:row-span-2">
      <Dekor
        jenis="cincin"
        className="absolute -right-16 -top-16 h-72 w-72 text-white/20"
      />
      <Dekor
        jenis="heksagon"
        className="absolute -bottom-20 -left-16 h-60 w-60 text-white/10"
      />

      <div className="relative flex h-full flex-col justify-between gap-8">
        <span className="w-fit rounded-full bg-white/20 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white">
          Santri Annuqayah
        </span>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="relative h-32 w-32 shrink-0 rotate-[-4deg] overflow-hidden rounded-[1.75rem] border-4 border-white/40 bg-blue-900 sm:h-40 sm:w-40">
            <Image
              src="/image/profil/profile.jpg"
              alt="Adlan Madjied Ridho"
              fill
              sizes="(max-width: 640px) 128px, 160px"
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Adlan
              <br />
              Madjied Ridho
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-blue-50/90">
              Santri Annuqayah yang mendalami pengembangan situs web dan karya
              tulis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KartuUmur({ umur }: { umur: number | string }) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-linear-to-br from-sky-500 to-blue-800 p-6 md:col-span-2">
      <Dekor
        jenis="titik"
        className="absolute -right-6 -top-6 h-36 w-36 text-white/15"
      />
      <Dekor
        jenis="bintang"
        className="absolute -bottom-6 right-4 h-20 w-20 text-white/25"
      />
      <span className="relative text-[11px] font-bold uppercase tracking-widest text-sky-100">
        Umur
      </span>
      <div className="relative mt-4 flex items-end gap-2">
        <span className="text-6xl font-black leading-none text-white">
          {umur}
        </span>
        {typeof umur === "number" && (
          <span className="pb-1 text-sm font-semibold text-sky-100">tahun</span>
        )}
      </div>
    </div>
  );
}

function KartuChat({
  onOpenChat,
  pengguna,
}: {
  onOpenChat: () => void;
  pengguna: Pengguna | null;
}) {
  const namaDepan = pengguna?.nama.trim().split(" ")[0];

  return (
    <button
      onClick={onOpenChat}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[2rem] border border-blue-400/30 bg-linear-to-br from-blue-950 to-blue-900 p-6 text-left transition duration-200 ease-out hover:scale-[1.03] hover:border-cyan-300/60 active:scale-[0.97] active:from-blue-900 active:to-blue-800 md:col-span-2"
    >
      <Dekor
        jenis="gelombang"
        className="absolute -right-8 -top-6 h-40 w-40 text-cyan-300/20"
      />

      {pengguna ? (
        <Avatar pengguna={pengguna} ukuran="relative h-10 w-10 text-sm" />
      ) : (
        <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-400 text-white">
          <IconChat className="h-5 w-5" />
        </span>
      )}

      <div className="relative mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold leading-tight text-white">
            {pengguna ? `Halo, ${namaDepan}!` : "Mari ngobrol"}
          </p>
          <p className="mt-1 text-xs text-blue-200/80">
            {pengguna
              ? "Senang kamu mampir. Ada ide proyek atau tulisan yang mau dibahas? Kirim pesanmu sekarang."
              : "Ide proyek, diskusi tulisan, atau sekadar menyapa. Login dulu untuk memulai."}
          </p>
        </div>
        <span className="shrink-0 text-cyan-300 transition-transform duration-200 group-hover:translate-x-1">
          <IconPanah />
        </span>
      </div>
    </button>
  );
}

/* ---------- Karya tulis ---------- */

const DEKOR_KARYA: JenisDekor[] = ["gelombang", "heksagon", "segitiga", "lengkung"];

function KartuKarya({ karya, indeks }: { karya: Post; indeks: number }) {
  const warna = WARNA_KARTU[indeks % WARNA_KARTU.length];
  const dekor = DEKOR_KARYA[indeks % DEKOR_KARYA.length];
  const nomor = String(indeks + 1).padStart(2, "0");

  return (
    <Link
      href={`/blog/${karya.slug || karya.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-linear-to-br ${warna} p-1.5 transition duration-300 hover:-translate-y-1.5 lg:even:mt-8`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.4rem] bg-blue-950/60">
        {karya.cover_url ? (
          <Image
            src={karya.cover_url}
            alt={`Sampul ${karya.title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center text-white/30">
            <Dekor
              jenis={dekor}
              className="absolute inset-0 h-full w-full text-white/10"
            />
            <IconPen className="relative h-12 w-12" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-blue-950/80 px-2.5 py-1 text-[10px] font-black tracking-widest text-cyan-200">
          {nomor}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col gap-1.5 px-3.5 pb-4 pt-3.5">
        <Dekor
          jenis={dekor}
          className="absolute -bottom-6 -right-6 h-24 w-24 text-white/15"
        />
        {karya.category && (
          <span className="relative text-[10px] font-bold uppercase tracking-widest text-blue-100/90">
            {karya.category}
          </span>
        )}
        <h3 className="relative line-clamp-2 text-base font-extrabold leading-snug text-white">
          {karya.title}
        </h3>
        {karya.summary && (
          <p className="relative line-clamp-3 text-xs leading-relaxed text-blue-50/80">
            {karya.summary}
          </p>
        )}
      </div>
    </Link>
  );
}

function SeksiKarya() {
  const [daftarKarya, setDaftarKarya] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, created_at, title, slug, category, status, summary, cover_url")
          .eq("status", "Published")
          .order("created_at", { ascending: false })
          .range(0, JUMLAH_KARYA - 1);

        if (error) throw error;
        if (data) setDaftarKarya(data);
      } catch (err) {
        console.error("Gagal memuat karya tulis:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchPosts();
  }, []);

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center justify-between">
        <JudulSeksi ikon={<IconPen />}>Karya Tulis</JudulSeksi>
        <Link
          href="/blog"
          className="flex items-center gap-1.5 rounded-full border border-blue-400/30 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:border-cyan-300/60 hover:text-cyan-200"
        >
          Lihat selebihnya
          <IconPanah />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-72 animate-pulse rounded-[1.75rem] bg-blue-900/30"
            />
          ))}
        </div>
      ) : daftarKarya.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-blue-400/30 bg-blue-950/40 p-10 text-center">
          <p className="text-sm text-blue-200/70">
            Belum ada karya tulis yang diterbitkan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {daftarKarya.map((karya, i) => (
            <KartuKarya key={karya.id} karya={karya} indeks={i} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Identitas, jabatan, pendidikan ---------- */

function KartuIdentitas({
  umur,
  onSecretClick,
}: {
  umur: number | string;
  onSecretClick: () => void;
}) {
  const baris: { label: string; nilai: string; rahasia?: boolean }[] = [
    { label: "Nama", nilai: "Adlan Madjied Ridho", rahasia: true },
    { label: "Panggilan", nilai: "Aji" },
    {
      label: "Umur",
      nilai: typeof umur === "number" ? `${umur} tahun` : String(umur),
    },
    { label: "Lahir", nilai: "01 September 2007" },
    { label: "Zodiak", nilai: "Virgo" },
    { label: "Alamat", nilai: "Sukogidri, Ledokombo, Jember" },
  ];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-blue-400/20 bg-linear-to-br from-blue-950 to-zinc-950 p-6 md:col-span-3">
      <Dekor
        jenis="garis"
        className="absolute -right-10 -top-10 h-44 w-44 text-blue-400/10"
      />
      <div className="relative">
        <JudulSeksi ikon={<IconUser />}>Identitas Diri</JudulSeksi>
        <dl className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {baris.map((b) => (
            <div key={b.label} className="rounded-2xl bg-blue-500/10 px-4 py-3">
              <dt
                onClick={b.rahasia ? onSecretClick : undefined}
                title={b.rahasia ? "Identity" : undefined}
                className={`text-[10px] font-bold uppercase tracking-widest text-blue-300 ${
                  b.rahasia
                    ? "cursor-default select-none transition-colors active:text-cyan-300"
                    : ""
                }`}
              >
                {b.label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-white">
                {b.nilai}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function KartuJabatan() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-blue-800 to-blue-950 p-6 md:col-span-3">
      <Dekor
        jenis="segitiga"
        className="absolute -bottom-10 -right-8 h-48 w-48 text-cyan-300/15"
      />
      <div className="relative">
        <JudulSeksi ikon={<IconBriefcase />}>Riwayat Jabatan</JudulSeksi>
        <ul className="mt-5 space-y-3">
          {RIWAYAT_JABATAN.map((j) => (
            <li
              key={j.jabatan}
              className={`flex items-center gap-4 rounded-2xl px-4 py-4 ${
                j.saatIni
                  ? "bg-linear-to-r from-blue-500 to-cyan-400"
                  : "bg-linear-to-r from-blue-500/30 to-transparent"
              }`}
            >
              <span
                className={`h-10 w-1.5 shrink-0 rounded-full ${
                  j.saatIni
                    ? "bg-white/70"
                    : "bg-linear-to-b from-cyan-300 to-blue-500"
                }`}
              />
              <div className="flex min-w-0 flex-col">
                <span className="text-base font-bold text-white">
                  {j.jabatan}
                </span>
                <span
                  className={`text-xs ${
                    j.saatIni ? "text-white/85" : "text-blue-200/80"
                  }`}
                >
                  {j.tempat}
                </span>
              </div>
              {j.saatIni && (
                <span className="ml-auto shrink-0 rounded-full bg-white/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                  Saat ini
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KartuPendidikan() {
  const terakhir = RIWAYAT_PENDIDIKAN.length - 1;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-blue-400/20 bg-linear-to-r from-zinc-950 via-blue-950 to-zinc-950 p-6 md:col-span-6">
      <Dekor
        jenis="lengkung"
        className="absolute -right-6 -top-6 h-40 w-40 text-blue-400/15"
      />
      <Dekor
        jenis="bintang"
        className="absolute bottom-3 left-[45%] hidden h-10 w-10 text-cyan-300/20 sm:block"
      />
      <div className="relative">
        <JudulSeksi ikon={<IconCap />}>Riwayat Pendidikan</JudulSeksi>
        <ol className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {RIWAYAT_PENDIDIKAN.map((edu, idx) => {
            const aktif = idx === terakhir;
            return (
              <li
                key={edu}
                className={`relative flex flex-col gap-2 rounded-2xl p-4 ${
                  aktif
                    ? "bg-linear-to-br from-blue-500 to-cyan-400 text-white"
                    : "bg-blue-500/10 text-blue-100"
                }`}
              >
                <span
                  className={`text-[10px] font-black tracking-widest ${
                    aktif ? "text-white/80" : "text-blue-300"
                  }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold leading-snug">{edu}</span>
                {aktif && (
                  <span className="w-fit rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    Saat ini
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ---------- Footer ---------- */

function Footer({ tahun }: { tahun: number | string }) {
  return (
    <footer className="mt-12 pb-24 text-center">
      <p className="text-xs tracking-wide text-blue-300/50">
        &copy; {tahun} AMR. Hak Cipta Dilindungi Undang-Undang.
      </p>
    </footer>
  );
}

/* ---------- Halaman utama ---------- */

export default function Home() {
  const [umurAji, setUmurAji] = useState<number | string>("-");
  const [tahunSekarang, setTahunSekarang] = useState<number | string>("");
  const [chatOpen, setChatOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { pengguna, siap } = useSesi();
  const jumlahPesanBaru = usePesanBaru(pengguna?.id, chatOpen);
  const router = useRouter();

  // Scrollbar biru gradasi untuk scroll halaman utama
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("scrollbar-biru");
    return () => html.classList.remove("scrollbar-biru");
  }, []);

  useEffect(() => {
    const hariIni = new Date();
    const tanggalLahir = new Date("2007-09-01");
    let hitungUmur = hariIni.getFullYear() - tanggalLahir.getFullYear();
    const bulan = hariIni.getMonth() - tanggalLahir.getMonth();

    if (bulan < 0 || (bulan === 0 && hariIni.getDate() < tanggalLahir.getDate())) {
      hitungUmur--;
    }

    setUmurAji(hitungUmur);
    setTahunSekarang(hariIni.getFullYear());
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(CHAT_REOPEN_KEY)) {
      sessionStorage.removeItem(CHAT_REOPEN_KEY);
      setChatOpen(true);
    }
  }, []);

  useEffect(() => {
    // Tutup modal login otomatis setelah berhasil masuk
    if (pengguna) setLoginOpen(false);
  }, [pengguna]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        router.push("/admin");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const openChat = () => setChatOpen(true);
  const openLogin = () => setLoginOpen(true);
  const handleAdminRedirect = () => router.push("/admin");

  return (
    <div className="min-h-screen bg-[#040a16] font-sans text-zinc-50 antialiased [background-image:radial-gradient(rgba(96,165,250,0.12)_1px,transparent_1px)] [background-size:24px_24px]">
      <Header pengguna={pengguna} siap={siap} onMasuk={openLogin} />

      <main className="mx-auto w-full max-w-5xl px-5">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <KartuHero />
          <KartuUmur umur={umurAji} />
          <KartuChat onOpenChat={openChat} pengguna={pengguna} />
        </section>

        <SeksiKarya />

        <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
          <KartuIdentitas umur={umurAji} onSecretClick={handleAdminRedirect} />
          <KartuJabatan />
          <KartuPendidikan />
        </section>

        <Footer tahun={tahunSekarang} />
      </main>

      <TombolHubungi
        onOpenChat={openChat}
        tersembunyi={chatOpen || loginOpen}
        jumlahBaru={jumlahPesanBaru}
      />
      <ChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onMasuk={openLogin}
      />

      {loginOpen && <ModalLogin onTutup={() => setLoginOpen(false)} />}
    </div>
  );
}