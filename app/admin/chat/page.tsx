"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type ChatUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number; // Menampung jumlah pesan belum dibaca
};

export default function ChatPage() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        setLoading(true);

        // Query 1: Ambil semua messages beserta is_admin & is_read untuk hitung unread
        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select("sender_id, text, created_at, is_admin, is_read")
          .order("created_at", { ascending: false });

        if (messagesError) {
          setError(messagesError.message);
          console.error("Error fetching messages:", messagesError);
          return;
        }

        // Dapatkan unique sender_ids dan filter null/undefined
        const senderIds = [
          ...new Set(
            messages?.map((m: any) => m.sender_id).filter((id: any) => id && id.trim?.() !== "") || []
          ),
        ];
        console.log("Filtered sender IDs:", senderIds);

        if (senderIds.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        // Query 2: Ambil profile data dengan error handling
        let profiles: any[] = [];
        if (senderIds.length > 0) {
          try {
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", senderIds);

            if (profilesError) {
              console.warn("Error fetching profiles (non-critical):", profilesError);
            } else {
              profiles = profilesData || [];
            }
          } catch (err) {
            console.warn("Exception fetching profiles:", err);
          }
        }

        // Buat map profiles untuk lookup cepat
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        // Hitung total unread messages per user (sender_id)
        // Kriterianya: is_admin = false DAN is_read = false
        const unreadCountsMap = new Map<string, number>();
        
        if (messages) {
          messages.forEach((msg: any) => {
            const senderId = msg.sender_id;
            if (senderId && !msg.is_admin && !msg.is_read) {
              const currentCount = unreadCountsMap.get(senderId) || 0;
              unreadCountsMap.set(senderId, currentCount + 1);
            }
          });
        }

        // Kelompokkan pesan berdasarkan sender_id untuk mengambil data chat terakhir
        const userMap = new Map<string, ChatUser>();

        if (messages) {
          messages.forEach((msg: any) => {
            const senderId = msg.sender_id;
            if (senderId && !userMap.has(senderId)) {
              const profile = profileMap.get(senderId);
              const displayName = profile?.full_name || senderId;
              const unreadCount = unreadCountsMap.get(senderId) || 0;
              
              userMap.set(senderId, {
                id: senderId,
                full_name: displayName,
                email: null,
                last_message: msg.text,
                last_message_time: msg.created_at,
                unread_count: unreadCount, // Pasangkan datanya ke sini
              });
            }
          });
        }

        setUsers(Array.from(userMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatUsers();
  }, []);

  return (
    <div className="w-full h-full p-6 md:pl-16">
      <h1 className="text-3xl font-bold mb-6">Daftar Obrolan</h1>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-600 px-4 py-3 rounded mb-4">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && users.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Tidak ada obrolan yang tersedia
          </p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="grid gap-3">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/admin/chat/${user.id}`}
              className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition border border-transparent hover:border-emerald-500/30 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {user.full_name || "Pengguna Tanpa Nama"}
                  </p>
                  {user.email && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
                      {user.email}
                    </p>
                  )}
                  <p className={`text-sm line-clamp-2 ${user.unread_count > 0 ? "text-zinc-900 dark:text-zinc-200 font-medium" : "text-zinc-600 dark:text-zinc-400"}`}>
                    {user.last_message || "Tidak ada pesan"}
                  </p>
                </div>

                {/* Sisi Kanan: Indikator Waktu & Bubble Angka Pesan Baru */}
                <div className="flex flex-col items-end justify-between h-full min-w-[70px] self-stretch">
                  {user.last_message_time && (
                    <p className={`text-[11px] ${user.unread_count > 0 ? "text-emerald-500 font-semibold" : "text-zinc-500"}`}>
                      {new Date(user.last_message_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  
                  {/* Bubble Notifikasi Emerald ala Premium Chat */}
                  {user.unread_count > 0 && (
                    <div className="mt-2 bg-emerald-500 text-white font-bold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm animate-in scale-in duration-200">
                      {user.unread_count}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Info tanggal opsional di bawah jika diperlukan */}
              {user.last_message_time && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-1 w-full">
                  {new Date(user.last_message_time).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}