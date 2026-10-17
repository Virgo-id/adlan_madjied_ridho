export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">Kamu sedang offline</h1>
      <p className="text-gray-600">
        Periksa koneksi internet lalu coba lagi.
      </p>
      <a href="/" className="rounded-lg bg-blue-600 px-4 py-2 text-white">
        Coba lagi
      </a>
    </main>
  );
}