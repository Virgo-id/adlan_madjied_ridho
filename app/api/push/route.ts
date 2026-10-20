import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_ID = process.env.ADMIN_USER_ID!;

export async function POST(req: NextRequest) {
  if (req.headers.get("x-webhook-secret") !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { record } = await req.json();
  if (!record?.sender_id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const dariAdmin = record.is_admin === true;
  const pemilikChatId: string = record.sender_id; // ID pengunjung pemilik percakapan

  let penerimaId: string;
  let judul: string;
  let url: string;

  if (dariAdmin) {
    penerimaId = pemilikChatId;
    judul = "Balasan dari Adlan";
    url = "/?chat=open";
  } else {
    penerimaId = ADMIN_ID;
    const { data: profil } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", pemilikChatId)
      .single();
    judul = `Pesan dari ${profil?.full_name ?? "pengunjung"}`;
    url = `/admin/chat/${pemilikChatId}`;
  }

  // Jumlah pesan belum dibaca untuk badge
  let q = admin
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);
  q = dariAdmin
    ? q.eq("sender_id", pemilikChatId).eq("is_admin", true)
    : q.eq("is_admin", false);
  const { count } = await q;

  const { data: subs, error: subscriptionError } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", penerimaId);
  const jumlahLangganan = subs?.length ?? 0;
  console.log(
    `[push] Jumlah langganan untuk penerima ${penerimaId.slice(0, 12)}: ${jumlahLangganan}`,
  );
  if (subscriptionError) {
    console.error("[push] Gagal mengambil langganan:", subscriptionError.message);
  }
  if (jumlahLangganan === 0) {
    console.log(
      `[push] Tidak ada langganan untuk penerima ${penerimaId.slice(0, 12)}.`,
    );
  }

  const isi = (
    record.text?.trim() ||
    (record.attachment_path ? "📎 Mengirim lampiran" : "Pesan baru")
  ).slice(0, 120);

  const payload = JSON.stringify({
    type: "chat",
    title: judul,
    body: isi,
    url,
    badge: count ?? 1,
    tag: `chat-${pemilikChatId}`,
  });

  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
      } catch (err: any) {
        console.error("[push] Pengiriman notifikasi gagal:", {
          statusCode: err.statusCode,
          body: err.body,
          penerimaId: penerimaId.slice(0, 12),
        });
        if (err.statusCode === 404 || err.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );

  return NextResponse.json({ ok: true });
}