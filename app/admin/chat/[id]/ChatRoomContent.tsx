"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function ChatRoomContent({ chatUserId }: { chatUserId: string }) {
  const router = useRouter();
  const senderId = chatUserId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [profileName, setProfileName] = useState("User");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Realtime Status State
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll otomatis setiap ada pesan baru
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Proteksi Auth Admin
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/loginadmin");
    };
    checkUser();
  }, [router]);

  // Close menu dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const markMessagesAsRead = useCallback(async () => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", senderId)
        .eq("is_admin", false)
        .eq("is_read", false);
    } catch (error) {
      console.error("Gagal memperbarui status terbaca:", error);
    }
  }, [senderId]);

  const enforceMessageLimit = useCallback(async (currentMessages: Message[]) => {
    if (currentMessages.length > 100) {
      const messagesToDelete = currentMessages.slice(0, 20);
      const idsToDelete = messagesToDelete.map((msg) => msg.id);

      try {
        const { error } = await supabase
          .from("messages")
          .delete()
          .in("id", idsToDelete);

        if (error) throw error;

        setMessages((prev) => prev.filter((msg) => !idsToDelete.includes(msg.id)));
      } catch (err) {
        console.error("Gagal memotong kapasitas pesan terlama:", err);
      }
    }
  }, []);

  const fetchRoomData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      // Ambil Profil User
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", senderId)
        .single();

      if (prof?.full_name) setProfileName(prof.full_name);
      if (prof?.avatar_url) setProfileAvatar(prof.avatar_url);

      // Ambil Pesan
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, text, is_admin, created_at, updated_at, reply_to_id, is_read")
        .eq("sender_id", senderId)
        .order("created_at", { ascending: true });

      if (msgs) {
        const validMessages = (msgs as any[]).filter(isValidMessage).map(msg => ({
          ...msg,
          status: "sent" as const
        }));
        setMessages(validMessages);
        await enforceMessageLimit(validMessages);
      }
    } catch (error) {
      console.error("Gagal memuat data chat:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [senderId, isValidMessage, enforceMessageLimit]);

  // Realtime Connection Setup
  useEffect(() => {
    fetchRoomData(false).then(() => {
      markMessagesAsRead();
    });

    const channel = supabase.channel(`room-${senderId}`, {
      config: {
        presence: { key: "admin" },
      },
    });

    channelRef.current = channel;

    channel
      // 1. Menangani Perubahan Data Postgres secara Realtime
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${senderId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            if (newMsg.is_admin) return;

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const updated = [...prev, { ...newMsg, status: "sent" as const }];
              return updated;
            });
            markMessagesAsRead();
          } 
          
          else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            );
          } 
          
          else if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setMessages((prev) => prev.filter((m) => m.id !== deletedId));
            }
          }
        }
      )
      // 2. Menangani Presence (Status Online/Offline)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const isUserInRoom = Object.prototype.hasOwnProperty.call(state, "user");
        setIsUserOnline(isUserInRoom);
      })
      // 3. Menangani Broadcast (Status Mengetik dari User)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.isTyping) {
          setIsUserTyping(true);
        } else {
          setIsUserTyping(false);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [senderId, fetchRoomData, markMessagesAsRead]);

  // Mengirim Sinyal Mengetik Admin ke User
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (!channelRef.current) return;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { isTyping: true },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { isTyping: false },
      });
    }, 2000);
  };

  const formatMessageTime = (updatedAt: string) => {
    const messageDate = new Date(updatedAt);
    const today = new Date();
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    return messageDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) + " " + messageDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Hapus pesan ini?")) return;
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      alert("Gagal menghapus pesan");
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    }
  };

  const handleClearAllMessages = async () => {
    const firstConfirmation = confirm(`Apakah Anda yakin ingin menghapus SEMUA pesan dengan ${profileName}?`);
    if (!firstConfirmation) return;

    const secondConfirmation = confirm("Tindakan ini permanen dan riwayat obrolan tidak dapat dikembalikan. Lanjutkan?");
    if (!secondConfirmation) return;

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("sender_id", senderId);

      if (error) throw error;

      setMessages([]);
      alert("Semua riwayat pesan berhasil dibersihkan.");
    } catch (error) {
      console.error("Gagal membersihkan pesan:", error);
      alert("Gagal menghapus semua pesan. Silakan coba lagi.");
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) return;
    const { error } = await supabase.from("messages").update({ text: editText }).eq("id", messageId);
    if (error) {
      alert("Gagal mengubah pesan");
    } else {
      setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, text: editText } : msg));
      setEditingId(null);
      setEditText("");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { isTyping: false },
    });

    const messageToSend = inputMessage;
    const currentReplyId = replyingTo?.id || null;

    setInputMessage("");
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: senderId,
      text: messageToSend,
      is_admin: true,
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
          sender_id: senderId,
          text: messageToSend,
          is_admin: true,
          reply_to_id: currentReplyId,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setInputMessage(messageToSend);
        return;
      }

      if (data) {
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === tempId
              ? ({
                  ...msg,
                  id: data.id,
                  status: "sent" as const,
                  created_at: data.created_at ?? msg.created_at,
                  updated_at: data.updated_at ?? msg.updated_at,
                } as Message)
              : msg
          );
          enforceMessageLimit(updated);
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setInputMessage(messageToSend);
    }
  };

  const getRepliedMessage = (replyToId: string | null | undefined) => {
    if (!replyToId) return null;
    return messages.find((m) => m.id === replyToId);
  };

  return (
    <div className="h-full bg-zinc-950 text-zinc-300 flex flex-col overflow-hidden antialiased">
      {/* Header Room Chat - Diperbarui agar bg menyatu dan tanpa border */}
      <header className="p-4 bg-zinc-950 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/chat" className="p-2 text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-900 md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          
          {/* FOTO PROFIL */}
          <div className="relative flex-shrink-0">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={profileAvatar} 
                alt={profileName} 
                className="w-9 h-9 rounded-full object-cover border border-zinc-900"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-200 text-xs font-bold uppercase border border-zinc-800">
                {profileName.charAt(0)}
              </div>
            )}
            
            {/* INDIKATOR ONLINE/OFFLINE */}
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 inline-block transition-colors duration-300 ${
              isUserOnline ? "bg-emerald-500" : "bg-zinc-600"
            }`}></span>
          </div>

          <div className="min-w-0">
            <h2 className="text-zinc-100 font-bold text-sm tracking-wide truncate">
              {profileName}
            </h2>
            <p className="text-[10px] font-medium tracking-wide mt-0.5 min-h-[12px]">
              {isUserTyping ? (
                <span className="text-sky-400 animate-pulse">sedang mengetik...</span>
              ) : isUserOnline ? (
                <span className="text-emerald-500">online</span>
              ) : (
                <span className="text-zinc-500">offline</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleClearAllMessages}
          title="Hapus semua pesan"
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-all rounded-xl border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          <span className="sr-only">Hapus Semua Pesan</span>
        </button>
      </header>

      {/* Area Teks Pesan */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-zinc-950 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-medium tracking-widest uppercase">
            Sinkronisasi...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-medium italic">
            Tidak ada pesan di obrolan ini.
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const repliedMsg = getRepliedMessage(msg.reply_to_id);

              return (
                <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"} items-end gap-2`}>
                  <div className={`flex flex-col w-full max-w-[85%] sm:max-w-[70%] ${msg.is_admin ? "items-end" : "items-start"}`}>
                    
                    {editingId === msg.id ? (
                      <div className="flex gap-2 w-full bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 bg-zinc-950 text-white text-xs px-3 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-200"
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
                              @{repliedMsg.is_admin ? "Anda" : profileName}
                            </span>
                            <p className="truncate text-zinc-400 text-[10px] mt-0.5">{repliedMsg.text}</p>
                          </div>
                        )}

                        <div
                          onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                          className={`p-3 px-4 text-xs leading-relaxed break-words cursor-pointer transition-colors border select-text ${
                            msg.is_admin
                              ? `bg-blue-700 border-blue-600 text-white hover:bg-blue-600 ${
                                  repliedMsg ? "rounded-b-xl rounded-tl-xl" : "rounded-2xl rounded-tr-none"
                                }`
                              : `bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 ${
                                  repliedMsg ? "rounded-b-xl rounded-tr-xl" : "rounded-2xl rounded-tl-none"
                                }`
                          }`}
                        >
                          {msg.text}
                        </div>

                        <div className={`mt-1 flex items-center gap-1 text-[10px] text-zinc-500 font-mono select-none pointer-events-none px-1 ${
                          msg.is_admin ? "justify-end" : "justify-start"
                        }`}>
                          <span>{msg.updated_at ? formatMessageTime(msg.updated_at) : ""}</span>
                          {msg.is_admin && (
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

                        {openMenuId === msg.id && (
                          <div ref={menuRef} className={`absolute top-full mt-1 w-24 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 overflow-hidden ${
                            msg.is_admin ? "right-0" : "left-0"
                          }`}>
                            <button type="button" onClick={() => { setReplyingTo(msg); setOpenMenuId(null); }} className="flex w-full text-[11px] px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 font-medium">
                              Balas
                            </button>
                            {msg.is_admin && (
                              <>
                                <button type="button" onClick={() => { setEditingId(msg.id); setEditText(msg.text); setOpenMenuId(null); }} className="flex w-full text-[11px] px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 font-medium border-t border-zinc-800">
                                  Edit
                                </button>
                                <button type="button" onClick={() => { handleDeleteMessage(msg.id); setOpenMenuId(null); }} className="flex w-full text-[11px] px-3 py-1.5 text-red-400 hover:bg-red-950 font-medium border-t border-zinc-800">
                                  Hapus
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Form Input Pesan - Diperbarui agar bg menyatu dan border luar hilang */}
      <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col bg-zinc-900 rounded-xl overflow-hidden transition-colors">
          {replyingTo && (
            <div className="flex items-center justify-between bg-zinc-900/50 border-b border-zinc-800/60 px-4 py-1.5">
              <div className="truncate pr-4 text-left border-l-2 border-blue-500 pl-2">
                <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  Membalas {replyingTo.is_admin ? "Anda" : profileName}
                </span>
                <span className="text-[11px] text-zinc-400 italic truncate block mt-0.5">
                  {replyingTo.text}
                </span>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="text-zinc-500 hover:text-zinc-300 text-xs p-1">✕</button>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5">
            <input
              value={inputMessage}
              onChange={handleInputChange}
              className="flex-1 bg-transparent text-zinc-200 text-xs outline-none py-2 px-1 placeholder-zinc-600"
              placeholder={replyingTo ? "Tulis balasan..." : "Ketik pesan..."}
            />
            <button type="submit" disabled={!inputMessage.trim()} className="bg-blue-600 text-white border border-blue-500 p-2 rounded-lg hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent w-8 h-8 flex items-center justify-center flex-shrink-0 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}