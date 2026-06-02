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

  // --- STATE REALTIME (ONLINE & TYPING) ---
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // --- AMBIL DATA MENGGUNAKAN RPC ---
  const fetchChatUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Memanggil fungsi SQL terpusat yang menggabungkan Profile + Pesan Terakhir + Unread Count
      const { data, error: rpcError } = await supabase.rpc("get_admin_chat_list");

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan memuat chat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatUsers(false);
  }, [fetchChatUsers]);

  // --- REALTIME MANAGER ---
  useEffect(() => {
    const channel = supabase.channel("sidebar-global-realtime", {
      config: {
        presence: { key: "admin-sidebar" },
      },
    });

    channel
      // 1. Sinkronisasi Pesan Masuk & Perubahan Status Baca (is_read)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          // Lewati jika ini merupakan pembersihan massal (DELETE) agar tidak lag
          if (payload.eventType === "DELETE") return;
          fetchChatUsers(true);
        }
      )
      // 2. Pantau Status Online/Offline Global
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeOnlineMap: Record<string, boolean> = {};

        Object.keys(state).forEach((key) => {
          // Jika key presence adalah user id langsung
          if (key !== "admin-sidebar") {
            activeOnlineMap[key] = true;
          } else {
            // Ekstraksi jika id disimpan di dalam nested payload/metadata presence track
            const presences = state[key] as any[];
            presences.forEach((p) => {
              if (p.userId) activeOnlineMap[p.userId] = true;
              if (p.id) activeOnlineMap[p.id] = true;
            });
          }
        });
        setOnlineUsers(activeOnlineMap);
      })
      // 3. Mendengarkan Sinyal Broadcast Mengetik
      .on("broadcast", { event: "typing_global" }, (payload) => {
        const { userId, isTyping } = payload.payload || {};
        if (!userId) return;

        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));

        // Pengaman timeout otomatis jika pengguna menutup tab mendadak saat mengetik
        if (isTyping) {
          if (typingTimeoutsRef.current[userId]) {
            clearTimeout(typingTimeoutsRef.current[userId]);
          }
          
          typingTimeoutsRef.current[userId] = setTimeout(() => {
            setTypingUsers((prev) => ({ ...prev, [userId]: false }));
          }, 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ active_at: new Date().toISOString(), role: "admin" });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      // Bersihkan seluruh timer jika admin berpindah halaman
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

      <div className="space-y-2 px-1">
        {users.map((user) => {
          const isActive = activeId === user.id;
          const nameInitial = (user.full_name || "U").charAt(0);
          
          const isUserOnline = onlineUsers[user.id] || false;
          const isUserTyping = typingUsers[user.id] || false;

          return (
            <Link
              key={user.id}
              href={`/admin/chat/${user.id}`}
              className={`group flex items-center gap-3 transition-all py-2.5 px-3 rounded-xl border ${
                isActive 
                  ? "bg-zinc-900/90 border-zinc-800 shadow-sm" 
                  : "bg-transparent border-transparent hover:bg-zinc-900/40"
              } select-none`}
            >
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name || "User"} 
                    className="w-9 h-9 rounded-full object-cover border border-zinc-900/50 grayscale-[10%] group-hover:grayscale-0 transition-all"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    {nameInitial}
                  </div>
                )}

                {/* Bulatan Online Status */}
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 transition-colors duration-300 ${
                  isUserOnline ? "bg-emerald-500" : "bg-zinc-700"
                }`}></span>
              </div>

              {/* Chat Info Content */}
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
                      {new Date(user.last_message_time).toLocaleTimeString("id-ID", { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2 mt-0.5">
                  {/* Pesan Terakhir atau teks Mengetik dinamis */}
                  <p className={`text-[11px] truncate transition-colors ${
                    isUserTyping 
                      ? "text-sky-400 font-medium animate-pulse" 
                      : isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                  }`}>
                    {isUserTyping ? "sedang mengetik..." : (user.last_message || "Tidak ada pesan")}
                  </p>

                  {/* Bubble Jumlah Pesan Belum Dibaca */}
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