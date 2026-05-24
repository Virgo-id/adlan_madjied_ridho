"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [waktuSekarang, setWaktuSekarang] = useState("");
  const [tanggalSekarang, setTanggalSekarang] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWaktu = () => {
      const sekarang = new Date();
      setWaktuSekarang(sekarang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      setTanggalSekarang(sekarang.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }));
    };
    updateWaktu();
    const timer = setInterval(updateWaktu, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main className="md:pl-20 px-6 min-h-screen flex flex-col items-center justify-start pt-6 md:pt-10 pb-24 bg-black transition-all duration-300">
      
      {/* TOP BAR INTEGRASI */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-16">
        <div className="flex items-center select-none">
          <span className="text-xs font-black tracking-widest text-zinc-400 uppercase">
            Adlan Madjied Ridho
          </span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="group flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-all hover:opacity-90 active:scale-95 ring-2 ring-zinc-700 ring-offset-2 ring-offset-black"
          >
            <img src="/image/profil/profil.jpg" alt="Adlan Madjied Ridho" className="h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-42 origin-top-right rounded-xl bg-zinc-900 p-1 shadow-xl shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <button onClick={() => router.push("/")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/30 transition-all">
                <i className="fa-solid fa-arrow-right-from-bracket text-sm" />
                <span>Keluar Panel</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* TAMPILAN JAM UTAMA */}
      <div className="w-full text-center select-none flex flex-col items-center justify-center mt-6 md:mt-12">
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent tabular-nums leading-none">
          {waktuSekarang || "--:--"}
        </h1>
        <p className="mt-4 text-xs md:text-sm font-bold tracking-widest text-zinc-600 uppercase">
          {tanggalSekarang || "Memuat hari..."}
        </p>
      </div>
    </main>
  );
}