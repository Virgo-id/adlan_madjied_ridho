import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function aktifkanNotifikasi() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Browser tidak mendukung notifikasi push");
  }

  const izin = await Notification.requestPermission();
  if (izin !== "granted") throw new Error("Izin notifikasi ditolak");

  // Aman dipanggil berulang: jika sudah terdaftar, hanya mengembalikan yang ada
  await navigator.serviceWorker.register("/sw.js");
  const reg = await navigator.serviceWorker.ready;  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    }));

  const json = sub.toJSON();
  const { error } = await supabase.rpc("register_push", {
    p_endpoint: json.endpoint,
    p_p256dh: json.keys?.p256dh,
    p_auth: json.keys?.auth,
  });
  if (error) throw error;
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