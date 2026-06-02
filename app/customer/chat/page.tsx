"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  sender_id: string;
  text: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  reply_to_id?: string | null;
  is_read: boolean;
  status?: "sending" | "sent";
}

export default function CustomerChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // State Edit Nama Profil Customer
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // State Manajemen Aksi Bubble Chat (Edit, Hapus, Balas)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // State Custom Delete Confirmation Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // --- STATE REALTIME STATUS ---
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Membagi channel menjadi dua kebutuhan khusus
  const roomChannelRef = useRef<any>(null); 
  const globalPresenceChannelRef = useRef<any>(null); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Menutup dropdown otomatis saat klik di luar area menu bubble chat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  // Auto-focus tombol konfirmasi hapus & handle keyboard shortcut (Enter/Esc)
  useEffect(() => {
    if (deleteTargetId) {
      confirmButtonRef.current?.focus();
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setDeleteTargetId(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [deleteTargetId]);

  const isValidMessage = useCallback((item: any): item is Message => {
    return (
      typeof item?.id === "string" &&
      typeof item?.sender_id === "string" &&
      typeof item?.text === "string" &&
      typeof item?.is_admin === "boolean" &&
      typeof item?.created_at === "string" &&
      typeof item?.updated_at === "string" &&
      typeof item?.is_read === "boolean"
    );
  }, []);

  const markMessagesAsRead = useCallback(async (userId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true } as any)
        .eq("sender_id", userId)
        .eq("is_admin", true)
        .eq("is_read" as any, false);
    } catch (error) {
      console.error("Gagal memperbarui status terbaca customer:", error);
    }
  }, []);

  const fetchChatData = useCallback(async (userId: string) => {
    try {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, text, is_admin, created_at, updated_at, reply_to_id, is_read")
        .eq("sender_id", userId)
        .order("created_at", { ascending: true });

      if (msgs) {
        const validMessages = (msgs as any[]).filter(isValidMessage).map(msg => ({
          ...msg,
          status: "sent" as const
        }));
        setMessages(validMessages);
      }
    } catch (error) {
      console.error("Gagal memuat pesan:", error);
    }
  }, [isValidMessage]);

  // --- ENGINE UTAMA REAL-TIME PRESENCE & BROADCAST ---
  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = "/customer/login";
        return;
      }
      setUser(authUser);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      
      setProfile(prof);
      setNewName(prof?.full_name || "");

      await fetchChatData(authUser.id);
      await markMessagesAsRead(authUser.id);

      // ==========================================
      // 1. CHANNEL GLOBAL: Pantau Status Online Admin
      // ==========================================
      const globalChannel = supabase.channel("sidebar-global-realtime", {
        config: {
          presence: { key: authUser.id }, // Daftarkan id user ke dalam presence pool global
        },
      });
      globalPresenceChannelRef.current = globalChannel;

      globalChannel
        .on("presence", { event: "sync" }, () => {
          const state = globalChannel.presenceState();
          
          // Cari apakah di dalam map presence global terdapat admin yang melacak diri mereka sendiri
          const hasAdmin = Object.keys(state).some((key) => {
            if (key === "admin-sidebar") return true;
            
            // Atau cek fallback jika id/role admin ditanam di dalam metadata track
            const dataList = state[key] as any[];
            return dataList.some((meta) => meta.role === "admin");
          });

          setIsAdminOnline(hasAdmin);
          if (!hasAdmin) setIsAdminTyping(false);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Ikut melacak kehadiran user di channel global ini agar admin tahu customer sedang online
            await globalChannel.track({ user_id: authUser.id, online_at: new Date().toISOString() });
          }
        });

      // ==========================================
      // 2. CHANNEL ROOM SPECIFIC: Mengurusi Pesan & Mengetik
      // ==========================================
      const roomChannel = supabase.channel(`room-${authUser.id}`);
      roomChannelRef.current = roomChannel;

      roomChannel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `sender_id=eq.${authUser.id}`, 
          },
          (payload) => {
            if (payload.eventType === "INSERT" && !payload.new?.is_admin) {
              return; 
            }

            fetchChatData(authUser.id).then(() => {
              if (payload.eventType === "INSERT" && payload.new?.is_admin) {
                markMessagesAsRead(authUser.id);
              }
            });
          }
        )
        // Mengetik dikirim melalui broadcast personal room id agar tidak mengganggu customer lain
        .on("broadcast", { event: "typing" }, (payload) => {
          setIsAdminTyping(!!payload.payload.isTyping);
        })
        .subscribe();
    };

    init();

    return () => {
      if (roomChannelRef.current) supabase.removeChannel(roomChannelRef.current);
      if (globalPresenceChannelRef.current) supabase.removeChannel(globalPresenceChannelRef.current);
    };
  }, [fetchChatData, markMessagesAsRead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!roomChannelRef.current) return;

    // Sinyal mengetik dikirim global ke admin list, dan spesifik ke personal room ini
    roomChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { isTyping: true },
    });

    if (globalPresenceChannelRef.current) {
      globalPresenceChannelRef.current.send({
        type: "broadcast",
        event: "typing_global",
        payload: { userId: user?.id, isTyping: true },
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      roomChannelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { isTyping: false },
      });

      if (globalPresenceChannelRef.current && user?.id) {
        globalPresenceChannelRef.current.send({
          type: "broadcast",
          event: "typing_global",
          payload: { userId: user.id, isTyping: false },
        });
      }
    }, 2000);
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || !user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: newName })
      .eq("id", user.id);

    if (!error) {
      setProfile({ ...profile, full_name: newName });
      setIsEditingName(false);
    } else {
      alert("Gagal update nama");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { isTyping: false },
    });

    if (globalPresenceChannelRef.current && user?.id) {
      globalPresenceChannelRef.current.send({
        type: "broadcast",
        event: "typing_global",
        payload: { userId: user.id, isTyping: false },
      });
    }

    const messageToSend = text;
    const currentReplyId = replyingTo?.id || null;

    setText("");
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user.id,
      text: messageToSend,
      is_admin: false,
      reply_to_id: currentReplyId,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          text: messageToSend,
          is_admin: false,
          reply_to_id: currentReplyId,
          is_read: false,
        } as any)
        .select()
        .single();

      if (error) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setText(messageToSend);
        return;
      }

      if (data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? ({
                  ...msg,
                  id: data.id,
                  status: "sent" as const,
                  created_at: data.created_at ?? msg.created_at,
                  updated_at: data.updated_at ?? msg.updated_at,
                } as Message)
              : msg
          )
        );
      }
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setText(messageToSend);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    const { error } = await supabase
      .from("messages")
      .update({ text: editText })
      .eq("id", messageId);

    if (error) {
      alert("Gagal mengubah pesan");
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, text: editText } : msg
        )
      );
      setEditingId(null);
      setEditText("");
    }
  };

  const executeDeleteMessage = async () => {
    if (!deleteTargetId) return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", deleteTargetId);

    if (error) {
      alert("Gagal menghapus pesan");
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== deleteTargetId));
    }
    setDeleteTargetId(null);
  };

  const formatMessageTime = (updatedAt: string | null | undefined) => {
    if (!updatedAt) return "Waktu tidak diketahui";
    const messageDate = new Date(updatedAt);
    if (isNaN(messageDate.getTime())) return "Waktu tidak diketahui";

    const today = new Date();
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    return messageDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) + " " + messageDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const getRepliedMessage = (replyToId: string | null | undefined) => {
    if (!replyToId) return null;
    return messages.find((m) => m.id === replyToId);
  };

  const infoText = "Website ini cocok untuk digunakan sebagai komunikasi untuk kebutuhan website maupun hanya sekadar obrolan.";

  return (
    <main className="h-screen w-screen bg-zinc-950 text-zinc-300 flex flex-row overflow-hidden antialiased relative">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-72 h-full border-r border-zinc-900 p-6 flex-col bg-zinc-950 flex-shrink-0">
        <h2 className="text-zinc-100 font-bold text-xs tracking-wide uppercase mb-4">Informasi</h2>
        <p className="text-zinc-500 text-xs leading-relaxed">{infoText}</p>
      </aside>

      {/* AREA KANAN */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 relative">
        
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-6 bg-transparent flex-shrink-0 z-10 w-full pt-4">
          <div className="flex flex-col min-w-0">
            <h1 className="text-white font-bold text-sm tracking-wide truncate">Adlan Madjied Ridho</h1>
            <p className="text-[10px] font-mono tracking-wide min-h-[12px] mt-0.5">
              {isAdminTyping ? (
                <span className="text-sky-400 animate-pulse">sedang mengetik...</span>
              ) : isAdminOnline ? (
                <span className="text-emerald-500">online</span>
              ) : (
                <span className="text-zinc-600">offline</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsInfoOpen(!isInfoOpen)} className="md:hidden text-zinc-500">
              <span className="text-xs border border-zinc-800 px-1.5 py-0.5 rounded-md">i</span>
            </button>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2.5 hover:bg-zinc-900 p-1.5 rounded-xl transition-colors">
              <span className="text-zinc-300 text-xs font-medium hidden md:inline">
                {profile?.full_name || "Customer"}
              </span>
              {user?.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-zinc-800 object-cover" alt="Avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-white font-bold uppercase">
                  {(profile?.full_name || "C").charAt(0)}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* AREA CHAT */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6 overflow-hidden">
          {isInfoOpen && (
            <div className="md:hidden bg-zinc-900 p-4 rounded-xl mb-4 text-xs text-zinc-400 border border-zinc-800 animate-in fade-in duration-150">
              {infoText}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {messages.map((msg) => {
              const repliedMsg = getRepliedMessage(msg.reply_to_id);

              return (
                <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"} items-end gap-2`}>
                  <div className={`flex flex-col w-full max-w-[85%] sm:max-w-[70%] ${msg.is_admin ? "items-start" : "items-end"}`}>
                    
                    {editingId === msg.id ? (
                      <div className="flex gap-2 w-full bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditMessage(msg.id);
                            if (e.key === "Escape") { setEditingId(null); setEditText(""); }
                          }}
                          className="flex-1 bg-zinc-950 text-xs px-3 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-200"
                          autoFocus
                        />
                        <button onClick={() => handleEditMessage(msg.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-bold hover:bg-blue-500 transition-colors">
                          OK
                        </button>
                        <button onClick={() => { setEditingId(null); setEditText(""); }} className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs rounded-lg font-medium hover:bg-zinc-700">
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="relative group max-w-full flex flex-col">
                        
                        {repliedMsg && (
                          <div className="px-3 py-1 text-[11px] bg-zinc-900 border-l-2 text-zinc-400 mb-[-4px] select-none rounded-t-lg max-w-full border-zinc-700">
                            <span className="block text-[9px] font-bold text-zinc-500 truncate">
                              @{repliedMsg.is_admin ? "Adlan (Admin)" : "Anda"}
                            </span>
                            <p className="truncate text-zinc-400 text-[10px] mt-0.5">{repliedMsg.text}</p>
                          </div>
                        )}

                        <div
                          onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                          className={`p-3 px-4 text-xs leading-relaxed break-words cursor-pointer transition-colors border select-text ${
                            msg.is_admin
                              ? `bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 ${
                                  repliedMsg ? "rounded-b-xl rounded-tr-xl" : "rounded-2xl rounded-tl-none"
                                }`
                              : `bg-blue-700 border-blue-600 text-white hover:bg-blue-600 ${
                                  repliedMsg ? "rounded-b-xl rounded-tl-xl" : "rounded-2xl rounded-tr-none"
                                }`
                          }`}
                        >
                          {msg.text}
                        </div>

                        {openMenuId === msg.id && (
                          <div 
                            ref={chatMenuRef}
                            className={`absolute top-full mt-1 w-24 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 overflow-hidden ${
                              msg.is_admin ? "left-0" : "right-0"
                            }`}
                          >
                            <button
                              onClick={() => { setReplyingTo(msg); setOpenMenuId(null); }}
                              className="flex w-full text-[11px] px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 font-medium"
                            >
                              Balas
                            </button>

                            {!msg.is_admin && (
                              <>
                                <button
                                  onClick={() => { setEditingId(msg.id); setEditText(msg.text); setOpenMenuId(null); }}
                                  className="flex w-full text-[11px] px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 font-medium border-t border-zinc-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => { setDeleteTargetId(msg.id); setOpenMenuId(null); }}
                                  className="flex w-full text-[11px] px-3 py-1.5 text-red-400 hover:bg-red-950 font-medium border-t border-zinc-800"
                                >
                                  Hapus
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        <div className={`mt-1 flex items-center gap-1 text-[10px] text-zinc-500 font-mono select-none px-1 ${
                          msg.is_admin ? "justify-start" : "justify-end"
                        }`}>
                          <span>{formatMessageTime(msg.updated_at)}</span>
                          
                          {!msg.is_admin && (
                            <span className="inline-flex ml-0.5">
                              {msg.status === "sending" ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-600">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3.5 h-3.5 ${msg.is_read ? "text-sky-400" : "text-zinc-500"}`}>
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M13.204 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.894 1.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="pt-3 mt-2 flex-shrink-0 bg-zinc-950">
            <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-zinc-700 transition-colors">
              
              {replyingTo && (
                <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-4 py-1.5">
                  <div className="truncate pr-4 text-left border-l-2 border-blue-500 pl-2">
                    <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      Membalas {replyingTo.is_admin ? "Adlan (Admin)" : "Diri Sendiri"}
                    </span>
                    <span className="text-[11px] text-zinc-400 italic truncate block mt-0.5">{replyingTo.text}</span>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-zinc-500 hover:text-zinc-300 text-xs p-1">✕</button>
                </div>
              )}

              <div className="flex items-center gap-2 px-3 py-1.5">
                <input
                  value={text}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent text-zinc-200 text-xs outline-none py-2 px-1 placeholder-zinc-600"
                  placeholder={replyingTo ? "Tulis balasan Anda..." : "Tulis pesan ke Adlan..."}
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="bg-blue-600 text-white border border-blue-500 p-2 rounded-lg hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent w-8 h-8 flex items-center justify-center flex-shrink-0 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* DROPDOWN MENU HEADER */}
        {isMenuOpen && (
          <div className="absolute top-16 right-6 w-56 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl z-50 overflow-hidden">
            {isEditingName ? (
              <div className="p-2 space-y-2">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Ubah Nama</p>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-950 text-white text-xs p-2 rounded border border-zinc-800 outline-none focus:border-blue-500"
                />
                <div className="flex gap-1.5">
                  <button onClick={handleUpdateName} className="flex-1 bg-blue-600 text-white text-[10px] py-1.5 rounded-lg font-bold hover:bg-blue-500 transition-colors">Simpan</button>
                  <button onClick={() => setIsEditingName(false)} className="px-2.5 bg-zinc-800 text-zinc-400 text-[10px] py-1.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">Batal</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="block w-full text-left text-zinc-300 text-xs p-3 hover:bg-zinc-800 rounded-lg transition-colors font-medium"
              >
                Edit Nama Panggilan
              </button>
            )}
            <div className="h-px bg-zinc-800/60 my-1" />
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/customer/login";
              }}
              className="block w-full text-left text-red-400 text-xs p-3 hover:bg-red-950/30 rounded-lg transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="space-y-1.5">
              <h3 className="text-white text-sm font-bold">Hapus Pesan?</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Tindakan ini tidak dapat dibatalkan. Pesan akan dihapus secara permanen.</p>
            </div>
            <div className="flex gap-2">
              <button
                ref={confirmButtonRef}
                onClick={executeDeleteMessage}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs py-2 rounded-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Hapus (Enter)
              </button>
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-colors focus:outline-none"
              >
                Batal (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}