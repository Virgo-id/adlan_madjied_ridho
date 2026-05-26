"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
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
  is_read: boolean; // Kolom status baca
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const senderId = id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [profileName, setProfileName] = useState("User");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // State fitur Balas (Reply)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/loginadmin");
    };
    checkUser();
  }, [router]);

  // Menutup dropdown otomatis saat klik di luar area menu
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

  const isValidMessage = (item: any): item is Message => {
    return (
      typeof item?.id === "string" &&
      typeof item?.sender_id === "string" &&
      typeof item?.text === "string" &&
      typeof item?.is_admin === "boolean" &&
      typeof item?.created_at === "string" &&
      typeof item?.updated_at === "string" &&
      typeof item?.is_read === "boolean" // Validasi kolom baru
    );
  };

  // Fungsi untuk menandai pesan masuk dari user sebagai terbaca
  const markMessagesAsRead = useCallback(async () => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true } as any)
        .eq("sender_id", senderId)
        .eq("is_admin", false)
        .eq("is_read" as any, false);
    } catch (error) {
      console.error("Gagal memperbarui status terbaca:", error);
    }
  }, [senderId]);

  // Fetching data dengan argumen silent agar tidak memicu efek berkedip
  const fetchRoomData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", senderId)
        .single();

      if (prof?.full_name) {
        setProfileName(prof.full_name);
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, text, is_admin, created_at, updated_at, reply_to_id, is_read")
        .eq("sender_id", senderId)
        .order("created_at", { ascending: true });

      if (msgs) {
        // DI SINI BYPASS-NYA BANG: Ditambahkan `as any[]` agar TS tidak komplain masalah cache
        const validMessages = (msgs as any[]).filter(isValidMessage);
        setMessages(validMessages);
      }
    } catch (error) {
      console.error("Gagal memuat data chat:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [senderId]);

  useEffect(() => {
    // Pengambilan data awal
    fetchRoomData(false).then(() => {
      // Tandai pesan sebagai terbaca di database setelah load awal selesai
      markMessagesAsRead();
    });

    const channel = supabase
      .channel(`room-${senderId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Mendengarkan aksi INSERT, UPDATE, dan DELETE
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${senderId}`,
        },
        (payload) => {
          console.log("Perubahan real-time terdeteksi:", payload);
          
          // Memperbarui data secara senyap di latar belakang tanpa kedipan halaman
          fetchRoomData(true).then(() => {
            // Jika ada pesan baru masuk dari user, langsung update menjadi terbaca
            if ((payload as any).eventType === "INSERT" && !(payload as any).new?.is_admin) {
              markMessagesAsRead();
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [senderId, fetchRoomData, markMessagesAsRead]);

  const formatMessageTime = (updatedAt: string) => {
    const messageDate = new Date(updatedAt);
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }

    if (messageDate < twoDaysAgo) {
      return messageDate.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    return messageDate.toLocaleString("id-ID", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Hapus pesan ini?")) return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("Gagal menghapus pesan:", error);
      alert("Gagal menghapus pesan");
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    const { error } = await supabase
      .from("messages")
      .update({ text: editText })
      .eq("id", messageId);

    if (error) {
      console.error("Gagal mengubah pesan:", error);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageToSend = inputMessage;
    const currentReplyId = replyingTo?.id || null;

    setInputMessage("");
    setReplyingTo(null);

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: senderId,
        text: messageToSend,
        is_admin: true,
        reply_to_id: currentReplyId,
        is_read: false, // Pesan baru dikirim statusnya false sampai dibaca user
      } as any);

      if (error) {
        console.error("Gagal mengirim pesan:", error);
        setInputMessage(messageToSend);
        
        if (error.code === '42501') {
          alert("Error: RLS policy - Hubungi admin untuk setup Supabase permissions");
        }
      }
    } catch (err) {
      console.error("Error saat mengirim pesan:", err);
      setInputMessage(messageToSend);
    }
  };

  const getRepliedMessage = (replyToId: string | null | undefined) => {
    if (!replyToId) return null;
    return messages.find((m) => m.id === replyToId);
  };

  return (
    <main className="h-screen bg-black text-zinc-300 flex flex-col overflow-hidden md:pl-16">
      <header className="p-4 border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex items-center gap-3 flex-shrink-0">
        <Link href="/admin/chat" className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-900">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h2 className="text-white font-bold text-xs tracking-wide">{profileName}</h2>
          <p className="text-[9px] text-zinc-500 font-mono tracking-tight mt-0.5">{senderId}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-zinc-950/10">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs animate-pulse">
            Memuat obrolan...
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const repliedMsg = getRepliedMessage(msg.reply_to_id);

              return (
                <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                  <div className={`flex flex-col w-full max-w-[85%] sm:max-w-[70%] md:max-w-[55%] ${msg.is_admin ? "items-end" : "items-start"}`}>
                    {editingId === msg.id ? (
                      <div className="flex gap-2 w-full">
                        <input
                          suppressHydrationWarning
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 bg-zinc-900 text-white text-xs px-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-emerald-600 transition-colors"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditMessage(msg.id)}
                          className="px-3 py-2 bg-emerald-600 text-white text-xs rounded-xl hover:bg-emerald-500 font-medium transition-colors whitespace-nowrap"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                          className="px-3 py-2 bg-zinc-800 text-white text-xs rounded-xl hover:bg-zinc-700 font-medium transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="relative group max-w-full flex flex-col">
                        
                        {/* Tampilan Balasan Premium */}
                        {repliedMsg && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 text-[11px] rounded-t-xl bg-zinc-900/60 border-l-[3px] backdrop-blur-sm select-none -mb-[1px] ${
                            msg.is_admin 
                              ? "border-emerald-500 text-zinc-400 self-end rounded-tl-xl w-full" 
                              : "border-zinc-500 text-zinc-400 self-start rounded-tr-xl w-full"
                          }`}>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-[9px] font-bold tracking-wide uppercase ${msg.is_admin ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                {repliedMsg.is_admin ? "Anda" : profileName}
                              </span>
                              <p className="truncate opacity-80 text-zinc-300 font-normal">{repliedMsg.text}</p>
                            </div>
                          </div>
                        )}

                        {/* Bubble Chat Utama */}
                        <div
                          onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                          className={`p-3 px-4 rounded-2xl text-xs leading-relaxed shadow-md whitespace-pre-wrap break-words cursor-pointer transition-all ${
                            msg.is_admin
                              ? `bg-emerald-600 text-white rounded-tr-none hover:bg-emerald-500/90 active:scale-[0.99] ${repliedMsg ? 'rounded-tl-none rounded-tr-none' : ''}`
                              : `bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800/60 hover:bg-zinc-900/80 ${repliedMsg ? 'rounded-tl-none rounded-tr-none' : ''}`
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Dropdown Menu Minimalis */}
                        {openMenuId === msg.id && (
                          <div 
                            ref={menuRef}
                            className={`absolute top-full mt-1.5 w-24 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
                              msg.is_admin ? "right-0 origin-top-right" : "left-0 origin-top-left"
                            }`}
                          >
                            <button
                              onClick={() => {
                                setReplyingTo(msg);
                                setOpenMenuId(null);
                              }}
                              className="flex w-full items-center text-left text-xs px-3 py-2 text-sky-400 hover:bg-zinc-800/60 transition-colors font-medium"
                            >
                              Balas
                            </button>

                            {msg.is_admin && (
                              <>
                                <div className="border-t border-zinc-800/60"></div>
                                <button
                                  onClick={() => {
                                    setEditingId(msg.id);
                                    setEditText(msg.text);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center text-left text-xs px-3 py-2 text-zinc-300 hover:bg-zinc-800/60 transition-colors font-medium"
                                >
                                  Edit
                                </button>
                                
                                <div className="border-t border-zinc-800/60"></div>
                                <button
                                  onClick={() => {
                                    handleDeleteMessage(msg.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center text-left text-xs px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                                >
                                  Hapus
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Info Waktu & Status Baca Centang Dua */}
                        <div className={`flex items-center gap-1 mt-1 text-[9px] text-zinc-500 font-mono select-none ${msg.is_admin ? "justify-end px-1" : "justify-start px-1"}`}>
                          <span>{msg.updated_at ? formatMessageTime(msg.updated_at) : ""}</span>
                          
                          {/* Tampilkan indikator centang dua hanya untuk pesan milik admin */}
                          {msg.is_admin && (
                            <span className="flex items-center">
                              {msg.is_read ? (
                                // Centang dua berwarna emerald jika sudah dibaca user
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-400">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M13.204 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.894 1.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                // Centang dua berwarna abu-abu jika belum dibaca user
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-zinc-600">
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
          </>
        )}
      </div>

      {/* Input Box Bar */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-900 bg-black/60 backdrop-blur-md flex-shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-emerald-600/50 transition-all">
          
          {/* Preview Balasan sebelum dikirim */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-zinc-950/80 border-b border-zinc-800/60 px-4 py-2 animate-in slide-in-from-bottom-2 duration-150">
              <div className="truncate pr-4 text-left border-l-2 border-sky-500 pl-2">
                <span className="block text-[8px] font-bold text-sky-400 uppercase tracking-wider">
                  Membalas {replyingTo.is_admin ? "Diri Sendiri" : profileName}
                </span>
                <span className="text-[11px] text-zinc-400 italic truncate block">
                  {replyingTo.text}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-zinc-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-2">
            <input
              suppressHydrationWarning
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-transparent text-white text-xs outline-none py-1.5 px-1 placeholder-zinc-500"
              placeholder={replyingTo ? "Ketik balasan Anda..." : "Ketik balasan untuk pengguna..."}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all flex items-center justify-center flex-shrink-0 w-8 h-8"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}