import { supabase } from "@/lib/supabase";

class KesalahanAktivasiNotifikasi extends Error {
  constructor(
    readonly langkah: string,
    pesan: string
  ) {
    super(pesan);
    this.name = "KesalahanAktivasiNotifikasi";
  }
}

function pesanError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function denganTimeout<T>(promise: PromiseLike<T>, ms: number, pesan: string) {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(pesan)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function samaKunci(a: ArrayBuffer | null, b: Uint8Array) {
  if (!a) return false;
  const bytes = new Uint8Array(a);
  return bytes.length === b.length && bytes.every((value, index) => value === b[index]);
}

async function tungguServiceWorkerAktif(
  registration: ServiceWorkerRegistration,
  timeoutMs = 10_000
) {
  if (registration.active?.state === "activated") return registration;

  const worker =
    registration.installing ?? registration.waiting ?? registration.active;
  if (!worker) {
    throw new Error("Service worker tidak memiliki worker yang dapat diaktifkan.");
  }

  await new Promise<void>((resolve, reject) => {
    const selesai = (error?: Error) => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", periksaStatus);
      if (error) reject(error);
      else resolve();
    };
    const periksaStatus = () => {
      if (worker.state === "activated") selesai();
      else if (worker.state === "redundant") {
        selesai(new Error("Service worker gagal diaktifkan (status redundant)."));
      }
    };
    const timer = setTimeout(
      () =>
        selesai(
          new Error(
            `Service worker belum aktif setelah ${timeoutMs / 1000} detik. Coba muat ulang halaman.`,
          ),
        ),
      timeoutMs,
    );
    worker.addEventListener("statechange", periksaStatus);
    periksaStatus();
  });

  return registration;
}

export async function aktifkanNotifikasi() {
  let langkah = "memeriksa dukungan browser";
  try {
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      throw new Error("Browser ini tidak mendukung notifikasi push.");
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey?.trim()) {
      throw new Error("Konfigurasi public key VAPID belum tersedia.");
    }
    langkah = "memeriksa public key VAPID";
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    langkah = "meminta izin notifikasi";
    const izin = await Notification.requestPermission();
    if (izin !== "granted") {
      throw new KesalahanAktivasiNotifikasi(
        "izin notifikasi",
        "Izin notifikasi tidak diberikan. Periksa pengaturan izin browser.",
      );
    }

    langkah = "mendaftarkan service worker";
    const reg = await denganTimeout(
      navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      }),
      10_000,
      "Pendaftaran service worker melewati batas waktu 10 detik.",
    );

    langkah = "menunggu service worker aktif";
    await tungguServiceWorkerAktif(reg);

    langkah = "memeriksa subscription push";
    let sub = await denganTimeout(
      reg.pushManager.getSubscription(),
      10_000,
      "Pemeriksaan subscription push melewati batas waktu 10 detik.",
    );
    if (sub && !samaKunci(sub.options.applicationServerKey, applicationServerKey)) {
      langkah = "memperbarui subscription dengan VAPID key terbaru";
      const berhasilUnsubscribe = await denganTimeout(
        sub.unsubscribe(),
        10_000,
        "Penghapusan subscription lama melewati batas waktu 10 detik.",
      );
      if (!berhasilUnsubscribe) {
        throw new Error("Subscription lama tidak berhasil dihapus.");
      }
      sub = null;
    }

    if (!sub) {
      langkah = "membuat subscription push";
      sub = await denganTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }),
        15_000,
        "Pembuatan subscription push melewati batas waktu 15 detik.",
      );
    }

    langkah = "menyimpan subscription ke Supabase";
    const json = sub.toJSON();
    const { error } = await denganTimeout(
      supabase.rpc("register_push", {
        p_endpoint: json.endpoint,
        p_p256dh: json.keys?.p256dh,
        p_auth: json.keys?.auth,
      }),
      15_000,
      "Penyimpanan subscription ke Supabase melewati batas waktu 15 detik.",
    );
    if (error) {
      const kode = error.code ? ` (kode ${error.code})` : "";
      throw new Error(`RPC register_push gagal${kode}: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof KesalahanAktivasiNotifikasi) throw error;
    throw new KesalahanAktivasiNotifikasi(langkah, pesanError(error));
  }
}

// Hitung ulang badge admin: total pesan pengunjung yang belum dibaca
export async function segarkanBadgeAdmin() {
  try {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", false)
      .eq("is_read", false);

    const nav = navigator as any;
    if (!count) await nav.clearAppBadge?.();
    else await nav.setAppBadge?.(count);
  } catch {}
}