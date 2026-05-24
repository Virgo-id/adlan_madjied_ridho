"use client";

export default function PortfolioContact() {
  const tahunSekarang = new Date().getFullYear();

  return (
    <div className="flex flex-col justify-between h-full py-4">
      {/* Konten Utama */}
      <div className="my-auto space-y-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Mari Terhubung
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Punya ide proyek web, diskusi karya tulis, atau sekadar ingin menyapa? Silakan kirim pesan melalui tombol chat di atas atau hubungi langsung via email.
          </p>
          <div className="flex gap-4 mt-2">
            <a 
              href="mailto:adlanmadjied@example.com"
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Email saya
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 pt-6 text-center dark:border-zinc-900">
        <p className="text-xs text-zinc-500 dark:text-zinc-600 tracking-wide">
          &copy; {tahunSekarang} AMR. All rights reserved.
        </p>
      </footer>
    </div>
  );
}