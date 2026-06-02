// src/app/admin/chat/ChatListSidebar.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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

  const fetchChatUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("sender_id, text, created_at, is_admin, is_read")
        .order("created_at", { ascending: false });

      if (messagesError) {
        setError(messagesError.message);
        return;
      }

      const senderIds = [
        ...new Set(
          messages?.map((m: any) => m.sender_id).filter((id: any) => id && id.trim?.() !== "") || []
        ),
      ];

      if (senderIds.length === 0) {
        setUsers([]);
        return;
      }

      let profiles: any[] = [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);
      profiles = profilesData || [];

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const unreadCountsMap = new Map<string, number>();
      if (messages) {
        messages.forEach((msg: any) => {
          const senderId = msg.sender_id;
          if (senderId && !msg.is_admin && !msg.is_read) {
            unreadCountsMap.set(senderId, (unreadCountsMap.get(senderId) || 0) + 1);
          }
        });
      }

      const userMap = new Map<string, ChatUser>();
      if (messages) {
        messages.forEach((msg: any) => {
          const senderId = msg.sender_id;
          if (senderId && !userMap.has(senderId)) {
            const profile = profileMap.get(senderId);
            userMap.set(senderId, {
              id: senderId,
              full_name: profile?.full_name || senderId,
              avatar_url: profile?.avatar_url || null,
              last_message: msg.text,
              last_message_time: msg.created_at,
              unread_count: unreadCountsMap.get(senderId) || 0,
            });
          }
        });
      }

      setUsers(Array.from(userMap.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatUsers(false);
  }, [fetchChatUsers]);

  useEffect(() => {
    const channel = supabase
      .channel("sidebar-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchChatUsers(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

      {/* Spacing diubah ke space-y-4 agar antar-user memiliki jarak bernafas yang pas karena tanpa border kotak */}
      <div className="space-y-4 px-1">
        {users.map((user) => {
          const isActive = activeId === user.id;
          const nameInitial = (user.full_name || "U").charAt(0);

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
                  
                  {user.last_message_time && (
                    <span className={`text-[9px] font-mono select-none flex-shrink-0 transition-colors ${
                      isActive ? "text-blue-500 font-bold" : "text-zinc-600 group-hover:text-zinc-500"
                    }`}>
                      {new Date(user.last_message_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2 mt-0.5">
                  <p className={`text-[11px] truncate transition-colors ${
                    isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                  }`}>
                    {user.last_message || "Tidak ada pesan"}
                  </p>

                  {/* Indikator Pesan Masuk (Hanya muncul jika ada pesan masuk baru) */}
                  {user.unread_count > 0 && (
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