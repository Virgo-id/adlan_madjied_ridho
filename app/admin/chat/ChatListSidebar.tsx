// src/app/admin/chat/ChatListSidebar.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type ChatUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
};

export default function ChatListSidebar({ activeId }: { activeId?: string }) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- STATE UNTUK REALTIME STATUS DI SIDEBAR ---
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchChatUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // 1. Ambil semua profil user terlebih dahulu
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url");

      if (profilesError) {
        setError(profilesError.message);
        return;
      }

      // 2. Ambil seluruh riwayat pesan untuk dipetakan ke profil masing-masing
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("sender_id, text, created_at, is_admin, is_read")
        .order("created_at", { ascending: false });

      if (messagesError) {
        setError(messagesError.message);
        return;
      }

      // 3. Petakan unread_count per user
      const unreadCountsMap = new Map<string, number>();
      if (messages) {
        messages.forEach((msg: any) => {
          const senderId = msg.sender_id;
          if (senderId && !msg.is_admin && !msg.is_read) {
            unreadCountsMap.set(senderId, (unreadCountsMap.get(senderId) || 0) + 1);
          }
        });
      }

      // 4. Ambil pesan terakhir (pesan paling baru) untuk setiap user
      const latestMessageMap = new Map<string, { text: string; created_at: string }>();
      if (messages) {
        messages.forEach((msg: any) => {
          const senderId = msg.sender_id;
          if (senderId && !latestMessageMap.has(senderId)) {
            latestMessageMap.set(senderId, {
              text: msg.text,
              created_at: msg.created_at,
            });
          }
        });
      }

      // 5. Satukan data profil dengan data pesan terakhirnya
      const detailedUsers: ChatUser[] = (profiles || []).map((profile: any) => {
        const latestMsg = latestMessageMap.get(profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name || "User Tanpa Nama",
          avatar_url: profile.avatar_url || null,
          last_message: latestMsg?.text || null,
          last_message_time: latestMsg?.created_at || null,
          unread_count: unreadCountsMap.get(profile.id) || 0,
        };
      });

      // 6. Urutkan: yang punya chat terbaru di paling atas, sisanya ditaruh di bawahnya
      detailedUsers.sort((a, b) => {
        if (a.last_message_time && b.last_message_time) {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        }
        return a.last_message_time ? -1 : b.last_message_time ? 1 : 0;
      });

      setUsers(detailedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatUsers(false);
  }, [fetchChatUsers]);

  // --- REALTIME SUBSCRIPTION (MESSAGES + PRESENCE GLOBAL + TYPING BROADCAST) ---
  useEffect(() => {
    // Membuat channel global untuk memantau aktivitas seluruh user di sidebar
    const channel = supabase.channel("sidebar-global-realtime", {
      config: {
        presence: { key: "admin-sidebar" },
      },
    });

    channel
      // 1. Sinkronisasi pesan masuk/hapus
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchChatUsers(true);
        }
      )
      // 2. Pantau status Online/Offline global dari user
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeOnlineMap: Record<string, boolean> = {};

        // Loop presences untuk menandai user id mana saja yang online
        Object.keys(state).forEach((key) => {
          // Asumsi di sisi client, key presence yang dikirim user berupa user id mereka sendiri atau mengandung info user id
          if (key !== "admin-sidebar") {
            activeOnlineMap[key] = true;
          }
        });
        setOnlineUsers(activeOnlineMap);
      })
      // 3. Mendengarkan sinyal mengetik (Broadcast) global
      .on("broadcast", { event: "typing_global" }, (payload) => {
        const { userId, isTyping } = payload.payload;
        if (!userId) return;

        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));

        // Keamanan timeout pembersih otomatis jika user mendadak offline tanpa mengirim sinyal false
        if (isTyping) {
          if (typingTimeoutsRef.current[userId]) clearTimeout(typingTimeoutsRef.current[userId]);
          
          typingTimeoutsRef.current[userId] = setTimeout(() => {
            setTypingUsers((prev) => ({ ...prev, [userId]: false }));
          }, 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ active_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      // Bersihkan semua timer timeout jika komponen unmount
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [fetchChatUsers]);

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-zinc-950 text-zinc-300 border-r border-zinc-900 custom-scrollbar antialiased">
      <h1 className="text-sm font-bold mb-6 tracking-widest uppercase text-zinc-500">Daftar Obrolan</h1>

      {loading && users.length === 0 && (
        <div className="text-center py-8 text-xs font-medium tracking-widest uppercase text-zinc-600 animate-pulse">
          Sinkronisasi...
        </div>
      )}
      
      {error && (
        <div className="text-red-400 text-xs bg-red-950/50 border border-red-900 p-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 px-1">
        {users.map((user) => {
          const isActive = activeId === user.id;
          const nameInitial = (user.full_name || "U").charAt(0);
          
          // Ambil status spesifik untuk user ini
          const isUserOnline = onlineUsers[user.id] || false;
          const isUserTyping = typingUsers[user.id] || false;

          return (
            <Link
              key={user.id}
              href={`/admin/chat/${user.id}`}
              className="group flex items-center gap-3 bg-transparent border-transparent transition-colors py-1 select-none"
            >
              {/* Avatar Ringkaran */}
              <div className="relative flex-shrink-0">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name || "User"} 
                    className="w-9 h-9 rounded-full object-cover border border-zinc-900/50 grayscale-[20%] group-hover:grayscale-0 transition-all"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    {nameInitial}
                  </div>
                )}

                {/* Bulatan Indikator Online/Offline */}
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 transition-colors duration-300 ${
                  isUserOnline ? "bg-emerald-500" : "bg-zinc-700"
                }`}></span>
              </div>

              {/* Detail Informasi Konten Chat */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-baseline gap-1.5">
                  <p className={`text-xs truncate transition-colors ${
                    isActive 
                      ? "text-white font-extrabold" 
                      : "text-zinc-300 font-semibold group-hover:text-zinc-100"
                  }`}>
                    {user.full_name || "User"}
                  </p>
                  
                  {user.last_message_time && !isUserTyping && (
                    <span className={`text-[9px] font-mono select-none flex-shrink-0 transition-colors ${
                      isActive ? "text-blue-500 font-bold" : "text-zinc-600 group-hover:text-zinc-500"
                    }`}>
                      {new Date(user.last_message_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2 mt-0.5">
                  {/* Teks Terakhir / Status Mengetik Dinamis */}
                  <p className={`text-[11px] truncate transition-colors ${
                    isUserTyping 
                      ? "text-sky-400 font-medium animate-pulse" 
                      : isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                  }`}>
                    {isUserTyping ? "sedang mengetik..." : (user.last_message || "Tidak ada pesan")}
                  </p>

                  {/* Indikator Pesan Masuk */}
                  {user.unread_count > 0 && !isUserTyping && (
                    <div className="bg-blue-600 text-white font-mono font-bold text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)] animate-in zoom-in duration-200">
                      {user.unread_count}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}