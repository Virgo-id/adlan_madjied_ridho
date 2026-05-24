"use client";

import Image from "next/image";

export default function HeroProfil({ umur }: { umur: number }) {
  return (
    <div className="flex flex-col justify-center h-full gap-8 py-4">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start text-center sm:text-left">
        {/* Tempat Foto Profil */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-800 shadow-sm sm:h-32 sm:w-32">
          <Image
            src="/image/profil/profil.jpg" // Jalur mutlak folder public/image/profil/profil.jpg
            alt="Adlan Madjied Ridho"
            fill
            sizes="(max-width: 640px) 112px, 128px"
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Adlan Madjied Ridho
          </h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Santri Annuqayah yang tertarik pada pengembangan website dan karya tulis.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-900">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
          Identitas Diri
        </h2>
        <ul className="grid grid-cols-1 gap-3 text-base text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Nama:</span> adlan madjied ridho</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Panggilan:</span> aji</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Umur:</span> {umur} tahun</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Lahir:</span> 01 September 2007</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Zodiak:</span> Virgo</li>
          <li><span className="font-semibold text-zinc-900 dark:text-zinc-100">Alamat:</span> Sukogidrih, Ledokombo, Jember</li>
        </ul>
      </div>
    </div>
  );
}