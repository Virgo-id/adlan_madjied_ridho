"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Icons
const ChevronDown = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronUp = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  
  // States untuk fitur tambahan
  const [showEmptyChats, setShowEmptyChats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // --- LOGIKA FILTERING ---
  const { activeChats, emptyChats } = useMemo(() => {
    const active = users.filter((u) => u.last_message !== null);
    const empty = users.filter(
      (u) => 
        u.last_message === null && 
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || "")
    );
    return { activeChats: active, emptyChats: empty };
  }, [users, searchQuery]);

  const fetchChatUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data, error: rpcError } = await supabase.rpc("get_admin_chat_list");
      if (rpcError) { setError(rpcError.message); return; }
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChatUsers(false); }, [fetchChatUsers]);

  // --- RENDER ITEM ---
  const renderUserItem = (user: ChatUser) => {
    const isActive = activeId === user.id;
    const isUserOnline = onlineUsers[user.id] || false;
    const isUserTyping = typingUsers[user.id] || false;
    const nameInitial = (user.full_name || "U").charAt(0);

    return (
      <Link
        key={user.id}
        href={`/admin/chat/${user.id}`}
        className={`group flex items-center gap-3 transition-all py-2.5 px-3 rounded-xl border ${
          isActive ? "bg-zinc-900/90 border-zinc-800" : "bg-transparent border-transparent hover:bg-zinc-900/40"
        }`}
      >
        <div className="relative flex-shrink-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name || "User"} className="w-9 h-9 rounded-full object-cover border border-zinc-900" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-zinc-900 text-zinc-400">
              {nameInitial}
            </div>
          )}
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${isUserOnline ? "bg-emerald-500" : "bg-zinc-700"}`}></span>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-300 truncate">{user.full_name || "User"}</p>
          <p className={`text-[11px] truncate ${isUserTyping ? "text-sky-400 animate-pulse" : "text-zinc-500"}`}>
            {isUserTyping ? "sedang mengetik..." : (user.last_message || "Tidak ada pesan")}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-zinc-950 text-zinc-300 border-r border-zinc-900 custom-scrollbar">
      <h1 className="text-sm font-bold mb-6 tracking-widest uppercase text-zinc-500">Daftar Obrolan</h1>

      {/* Active Chats */}
      <div className="space-y-2 px-1">
        {activeChats.map(renderUserItem)}
      </div>

      {/* Empty Chats Dropdown */}
      {users.some(u => u.last_message === null) && (
        <div className="mt-6 border-t border-zinc-900 pt-4">
          <button 
            onClick={() => setShowEmptyChats(!showEmptyChats)}
            className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 px-3"
          >
            <span>Pengguna tanpa pesan</span>
            {showEmptyChats ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showEmptyChats && (
            <div className="mt-3 px-1 space-y-2">
              <input 
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-700 mb-2"
              />
              {searchQuery 
                ? emptyChats.map(renderUserItem)
                : emptyChats.slice(0, 5).map(renderUserItem)
              }
              {emptyChats.length > 5 && !searchQuery && (
                <p className="text-[10px] text-zinc-700 px-2 italic">...dan {emptyChats.length - 5} lainnya</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}