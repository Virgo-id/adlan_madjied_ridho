"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  GraduationCap,
  PartyPopper,
} from "lucide-react";

/* ---------- Tipe & Data ---------- */

interface Kuliah {
  hari: number; // 0 = Minggu ... 6 = Sabtu
  jam: string;
  mk: string;
  sks: number;
  ruang: string;
  dosen: string;
}

interface KuliahTerurai extends Kuliah {
  mulai: number; // menit sejak 00.00
  selesai: number;
}

type StatusKelas = "berlangsung" | "berikutnya" | "selesai" | "hari-ini" | "";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Urutan tampilan: Senin sampai Minggu
const URUTAN = [1, 2, 3, 4, 5, 6, 0];

// Warna bingkai kartu, sama seperti halaman admin lainnya
const WARNA_KARTU = [
  "from-blue-600 to-cyan-400",
  "from-sky-500 to-blue-700",
  "from-cyan-500 to-blue-600",
  "from-blue-800 to-sky-500",
];

const JADWAL: Kuliah[] = [
  { hari: 1, jam: "09.15-11.50", mk: "Pengantar Basis Data", sks: 3, ruang: "Lab. ICT 1", dosen: "Imam Wahyudi" },
  { hari: 1, jam: "11.50-14.55", mk: "Desain dan Analisis Sistem", sks: 3, ruang: "RU.03", dosen: "La Ode Abdul Wahid" },
  { hari: 2, jam: "08.20-11.50", mk: "Pemrograman Berorientasi Objek", sks: 4, ruang: "Lab. ICT 2", dosen: "Imam Wahyudi" },
  { hari: 2, jam: "11.50-14.55", mk: "Pemrograman Sistem dan Jaringan", sks: 3, ruang: "Lab. ICT 1", dosen: "Nur Prayogo Fajry" },
  { hari: 3, jam: "11.00-14.05", mk: "Komunikasi Data", sks: 3, ruang: "RU.01", dosen: "La Ode Abdul Wahid" },
  { hari: 0, jam: "11.00-14.05", mk: "Rekayasa Perangkat Lunak", sks: 3, ruang: "Lab. ICT 2", dosen: "Mohammad Waail Al Wajieh" },
  { hari: 0, jam: "14.05-15.45", mk: "Manajemen Sistem Informasi", sks: 2, ruang: "RU.03", dosen: "Fanani Rahman Arif, S.T." },
];

const DATA: KuliahTerurai[] = JADWAL.map((d) => {
  const [a, b] = d.jam.split("-").map((t) => {
    const [h, m] = t.split(".").map(Number);
    return h * 60 + m;
  });
  return { ...d, mulai: a, selesai: b };
});

/* ---------- Fungsi Bantu ---------- */

const pad = (n: number) => String(n).padStart(2, "0");

const fmt = (m: number) => `${pad(Math.floor(m / 60))}.${pad(m % 60)}`;

const durasi = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return ((h ? `${h} jam ` : "") + (mm ? `${mm} menit` : "")).trim() || "0 menit";
};

const menitSekarang = (d: Date) =>
  d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

function statusKelas(d: KuliahTerurai, now: Date): StatusKelas {
  if (d.hari !== now.getDay()) return "";

  const n = menitSekarang(now);
  if (n >= d.mulai && n < d.selesai) return "berlangsung";
  if (n >= d.selesai) return "selesai";

  const berikut = DATA.filter((x) => x.hari === d.hari && x.mulai > n).sort(
    (a, b) => a.mulai - b.mulai
  )[0];

  return berikut === d ? "berikutnya" : "hari-ini";
}

/* ---------- Halaman ---------- */

export default function JadwalKuliahPage() {
  // null saat server render agar tidak terjadi hydration mismatch
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const awal = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);

    return () => {
      clearTimeout(awal);
      clearInterval(interval);
    };
  }, []);

  const hariIni = now ? now.getDay() : -1;

  const agendaHariIni = DATA.filter((d) => d.hari === hariIni).sort(
    (a, b) => a.mulai - b.mulai
  );

  const hariAktif = URUTAN.filter((h) => DATA.some((d) => d.hari === h));

  return (
    // Tanpa background & tanpa offset sidebar: keduanya sudah ditangani layout admin
    <main className="min-h-screen px-5 pb-28 pt-12 font-sans text-zinc-50 antialiased md:pb-24">
      {/* ---------- Header ---------- */}
      <div className="mx-auto mb-8 flex w-full max-w-6xl flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-400 text-white">
            <CalendarDays className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
              Jadwal Kuliah
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-blue-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Ganjil 2026/2027 · Kelas A25
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-black tabular-nums leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
            {now
              ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
              : "--:--:--"}
          </p>
          <p className="mt-1 text-xs font-semibold text-blue-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {now
              ? `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`
              : "Memuat tanggal…"}
          </p>
        </div>
      </div>

      {/* ---------- Kotak Hari Ini ---------- */}
      <section className="mx-auto mb-6 w-full max-w-6xl rounded-[1.75rem] bg-linear-to-br from-blue-800 to-sky-500 p-1.5">
        <div className="rounded-[1.4rem] bg-blue-950/90 px-5 py-4">
          <h3 className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-200/70">
            <CalendarDays className="h-3.5 w-3.5" />
            Hari Ini
          </h3>

          {!now ? (
            <p className="text-xs text-blue-200/70">Memuat…</p>
          ) : agendaHariIni.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <PartyPopper className="h-4 w-4 shrink-0" />
              Libur, tidak ada kuliah hari ini. Selamat istirahat!
            </p>
          ) : (
            <ul className="divide-y divide-blue-400/15">
              {agendaHariIni.map((d) => {
                const st = statusKelas(d, now);
                return (
                  <li
                    key={`${d.hari}-${d.jam}`}
                    className={`flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-xs ${
                      st === "selesai" ? "opacity-45" : ""
                    }`}
                  >
                    <span
                      className={`flex min-w-[7rem] items-center gap-1.5 font-bold tabular-nums ${
                        st === "berlangsung" ? "text-emerald-300" : "text-cyan-200"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {fmt(d.mulai)}–{fmt(d.selesai)}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-white">
                      {d.mk}
                    </span>
                    <span className="flex items-center gap-1 text-blue-200/80">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {d.ruang}
                    </span>
                    {st === "berlangsung" && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                        Berlangsung
                      </span>
                    )}
                    {st === "berikutnya" && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300">
                        Berikutnya
                      </span>
                    )}
                    {st === "selesai" && (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-200">
                        Selesai
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ---------- Papan Mingguan ---------- */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] items-start gap-5">
        {hariAktif.map((h, i) => {
          const baris = DATA.filter((d) => d.hari === h).sort(
            (a, b) => a.mulai - b.mulai
          );
          const sksHari = baris.reduce((s, d) => s + d.sks, 0);
          const adalahHariIni = h === hariIni;

          return (
            <section
              key={h}
              className={`rounded-[1.75rem] bg-linear-to-br ${WARNA_KARTU[i % WARNA_KARTU.length]} p-1.5 transition duration-300 hover:-translate-y-1 ${
                adalahHariIni ? "ring-2 ring-cyan-200/80" : ""
              }`}
            >
              <div className="rounded-[1.4rem] bg-blue-950/90 p-3">
                {/* Header hari */}
                <div className="mb-3 flex items-center justify-between gap-2 px-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{HARI[h]}</h3>
                    {adalahHariIni && (
                      <span className="rounded-full bg-linear-to-r from-blue-500 to-cyan-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                        Hari ini
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/70">
                    {baris.length} MK · {sksHari} SKS
                  </span>
                </div>

                {/* Daftar kelas */}
                <div className="flex flex-col gap-2">
                  {baris.map((d) => {
                    const st = now ? statusKelas(d, now) : "";

                    const garis =
                      st === "berlangsung"
                        ? "bg-emerald-400"
                        : st === "berikutnya"
                          ? "bg-amber-300"
                          : st === "hari-ini"
                            ? "bg-cyan-300"
                            : "bg-blue-400/30";

                    return (
                      <article
                        key={`${d.hari}-${d.jam}`}
                        className={`relative rounded-2xl border py-3 pl-4 pr-3 transition duration-200 ${
                          st === "berlangsung"
                            ? "border-emerald-400/50 bg-emerald-500/10"
                            : "border-blue-400/20 bg-blue-900/30 hover:bg-blue-800/40"
                        } ${st === "selesai" ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`absolute bottom-3 left-0 top-3 w-1 rounded-full ${garis}`}
                        />

                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold tabular-nums text-cyan-200">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 shrink-0" />
                            {fmt(d.mulai)} – {fmt(d.selesai)}
                          </span>
                          <span className="text-blue-200/60">
                            {durasi(d.selesai - d.mulai)}
                          </span>
                        </div>

                        <h4 className="mb-1.5 mt-1 text-sm font-extrabold leading-snug text-white">
                          {d.mk}
                        </h4>

                        <div className="flex flex-col gap-1 text-[11px] leading-relaxed text-blue-200/80">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {d.ruang}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            {d.dosen}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {st === "berlangsung" && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                              Berlangsung
                            </span>
                          )}
                          {st === "berikutnya" && (
                            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300">
                              Berikutnya
                            </span>
                          )}
                          {st === "selesai" && (
                            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-200">
                              Selesai
                            </span>
                          )}
                          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-200">
                            {d.sks} SKS
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}