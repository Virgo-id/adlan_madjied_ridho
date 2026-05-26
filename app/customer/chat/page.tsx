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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);

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

  const isValidMessage = (item: any): item is Message => {
    return (
      typeof item?.id === "string" &&
      typeof item?.sender_id === "string" &&
      typeof item?.text === "string" &&
      typeof item?.is_admin === "boolean" &&
      typeof item?.created_at === "string" &&
      typeof item?.updated_at === "string" &&
      typeof item?.is_read === "boolean"
    );
  };

  // Fungsi menandai pesan masuk dari admin sebagai terbaca oleh customer
  const markMessagesAsRead = useCallback(async (userId: string) => {
    try {
      // BYPASS ERROR 2353 & 2345: Paksa payload update dan query 'is_read' sebagai any
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

  // Fetch data chat
  const fetchChatData = useCallback(async (userId: string) => {
    try {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, text, is_admin, created_at, updated_at, reply_to_id, is_read")
        .eq("sender_id", userId)
        .order("created_at", { ascending: true });

      if (msgs) {
        // BYPASS ERROR 2345: Cast 'msgs' ke any[] terlebih dahulu sebelum melakukan filtering ke Message[]
        const validMessages = (msgs as any[]).filter(isValidMessage);
        setMessages(validMessages);
      }
    } catch (error) {
      console.error("Gagal memuat pesan:", error);
    }
  }, []);

  useEffect(() => {
    let activeUserId: string | null = null;
    let channel: any = null;

    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = "/customer/login";
        return;
      }
      setUser(authUser);
      activeUserId = authUser.id;

      // Ambil profil kustomer
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      
      setProfile(prof);
      setNewName(prof?.full_name || "");

      // Ambil pesan awal & langsung tandai pesan admin sebagai terbaca
      await fetchChatData(authUser.id);
      await markMessagesAsRead(authUser.id);

      // Jalankan Engine Real-time Supabase Channel
      channel = supabase
        .channel(`room-${authUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `sender_id=eq.${authUser.id}`, 
          },
          (payload) => {
            console.log("Perubahan real-time terdeteksi customer:", payload);
            fetchChatData(authUser.id).then(() => {
              if (payload.eventType === "INSERT" && payload.new?.is_admin) {
                markMessagesAsRead(authUser.id);
              }
            });
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchChatData, markMessagesAsRead]);

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

    const messageToSend = text;
    const currentReplyId = replyingTo?.id || null;

    setText("");
    setReplyingTo(null);

    try {
      // BYPASS ERROR 2322: Ditambahkan 'as any' pada objek insert agar TS tidak menolak property is_read: false
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        text: messageToSend,
        is_admin: false,
        reply_to_id: currentReplyId,
        is_read: false,
      } as any);

      if (error) {
        console.error("Gagal mengirim pesan customer:", error);
        setText(messageToSend);
      }
    } catch (err) {
      console.error("Error kirim pesan customer:", err);
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

  const formatMessageTime = (updatedAt: string) => {
    const messageDate = new Date(updatedAt);
    return messageDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const getRepliedMessage = (replyToId: string | null | undefined) => {
    if (!replyToId) return null;
    return messages.find((m) => m.id === replyToId);
  };

  const infoText = "Website ini cocok untuk digunakan sebagai komunikasi untuk kebutuhan website maupun hanya sekadar obrolan.";

  return (
    <main className="h-screen bg-black text-zinc-300 flex flex-col relative overflow-hidden">
      
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/60 backdrop-blur-md flex-shrink-0 z-10">
        <h1 className="text-white font-bold text-xs tracking-wide truncate">Chat with Adlan Madjied Ridho</h1>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsInfoOpen(!isInfoOpen)} className="md:hidden text-zinc-500">
            <span className="text-xs border border-zinc-800 px-1.5 py-0.5 rounded-md">i</span>
          </button>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2.5 hover:bg-zinc-900 p-1.5 rounded-lg transition-colors">
            <span className="text-zinc-300 text-xs font-medium hidden md:inline">
              {profile?.full_name || "Customer"}
            </span>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} className="w-7 h-7 rounded-full border border-zinc-800" alt="Avatar" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white font-bold">C</div>
            )}
          </button>
        </div>
      </header>

      {/* BODY AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Info (Desktop) */}
        <aside className="hidden md:flex w-72 border-r border-zinc-900 p-6 flex-col bg-zinc-950">
          <h2 className="text-white font-bold text-xs tracking-wide uppercase mb-4 text-zinc-400">Informasi</h2>
          <p className="text-zinc-500 text-xs leading-relaxed">{infoText}</p>
        </aside>

        {/* Chat Room Area */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6 overflow-hidden">
          {isInfoOpen && (
            <div className="md:hidden bg-zinc-900/50 backdrop-blur-md p-4 rounded-xl mb-4 text-xs text-zinc-400 border border-zinc-800 animate-in fade-in duration-150">
              {infoText}
            </div>
          )}

          {/* Messages List Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {messages.map((msg) => {
              const repliedMsg = getRepliedMessage(msg.reply_to_id);

              return (
                <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                  <div className={`flex flex-col w-full max-w-[85%] sm:max-w-[70%] md:max-w-[55%] ${msg.is_admin ? "items-start" : "items-end"}`}>
                    
                    {editingId === msg.id ? (
                      <div className="flex gap-2 w-full">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 bg-zinc-900 text-white text-xs px-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-emerald-600"
                          autoFocus
                        />
                        <button onClick={() => handleEditMessage(msg.id)} className="px-3 py-2 bg-emerald-600 text-white text-xs rounded-xl font-medium">Simpan</button>
                        <button onClick={() => { setEditingId(null); setEditText(""); }} className="px-3 py-2 bg-zinc-800 text-white text-xs rounded-xl font-medium">Batal</button>
                      </div>
                    ) : (
                      <div className="relative group max-w-full flex flex-col">
                        
                        {/* Tampilan Balasan Premium */}
                        {repliedMsg && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 text-[11px] rounded-t-xl bg-zinc-900/60 border-l-[3px] backdrop-blur-sm select-none -mb-[1px] ${
                            msg.is_admin 
                              ? "border-zinc-500 text-zinc-400 self-start rounded-tr-xl w-full"
                              : "border-emerald-500 text-zinc-400 self-end rounded-tl-xl w-full"
                          }`}>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-[9px] font-bold tracking-wide uppercase ${msg.is_admin ? 'text-zinc-500' : 'text-emerald-400'}`}>
                                {repliedMsg.is_admin ? "Adlan (Admin)" : "Anda"}
                              </span>
                              <p className="truncate opacity-80 text-zinc-300">{repliedMsg.text}</p>
                            </div>
                          </div>
                        )}

                        {/* Bubble Chat Utama */}
                        <div
                          onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                          className={`p-3 px-4 rounded-2xl text-xs leading-relaxed shadow-md whitespace-pre-wrap break-words cursor-pointer transition-all ${
                            msg.is_admin
                              ? `bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800/60 hover:bg-zinc-900/80 ${repliedMsg ? 'rounded-tl-none rounded-tr-none' : ''}`
                              : `bg-emerald-600 text-white rounded-tr-none hover:bg-emerald-500/90 ${repliedMsg ? 'rounded-tl-none rounded-tr-none' : ''}`
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Dropdown Menu Minimalis */}
                        {openMenuId === msg.id && (
                          <div 
                            ref={chatMenuRef}
                            className={`absolute top-full mt-1.5 w-24 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
                              msg.is_admin ? "left-0 origin-top-left" : "right-0 origin-top-right"
                            }`}
                          >
                            <button
                              onClick={() => { setReplyingTo(msg); setOpenMenuId(null); }}
                              className="flex w-full items-center text-xs px-3 py-2 text-sky-400 hover:bg-zinc-800/60 font-medium"
                            >
                              Balas
                            </button>

                            {!msg.is_admin && (
                              <>
                                <div className="border-t border-zinc-800/60" />
                                <button
                                  onClick={() => { setEditingId(msg.id); setEditText(msg.text); setOpenMenuId(null); }}
                                  className="flex w-full items-center text-xs px-3 py-2 text-zinc-300 hover:bg-zinc-800/60 font-medium"
                                >
                                  Edit
                                </button>
                                <div className="border-t border-zinc-800/60" />
                                <button
                                  onClick={() => { handleDeleteMessage(msg.id); setOpenMenuId(null); }}
                                  className="flex w-full items-center text-xs px-3 py-2 text-red-400 hover:bg-red-500/10 font-medium"
                                >
                                  Hapus
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Info Waktu & Status Baca Centang Dua */}
                        <div className={`flex items-center gap-1 mt-1 text-[9px] text-zinc-500 font-mono select-none ${msg.is_admin ? "justify-start px-1" : "justify-end px-1"}`}>
                          <span>{msg.created_at ? formatMessageTime(msg.created_at) : ""}</span>
                          
                          {/* Status Baca Centang Dua Khusus Chat Customer */}
                          {!msg.is_admin && (
                            <span className="flex items-center">
                              {msg.is_read ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-400">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M13.204 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.894 1.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              ) : (
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
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSendMessage} className="pt-4 border-t border-zinc-900 mt-2 flex-shrink-0 bg-black">
            <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-emerald-600/50 transition-all">
              
              {/* Preview Box Balasan Aktif */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-zinc-950/80 border-b border-zinc-800/60 px-4 py-2 animate-in slide-in-from-bottom-2 duration-150">
                  <div className="truncate pr-4 text-left border-l-2 border-sky-500 pl-2">
                    <span className="block text-[8px] font-bold text-sky-400 uppercase tracking-wider">
                      Membalas {replyingTo?.is_admin ? "Adlan (Admin)" : "Diri Sendiri"}
                    </span>
                    <span className="text-[11px] text-zinc-400 italic truncate block">{replyingTo?.text}</span>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-zinc-500 hover:text-white text-xs p-1">✕</button>
                </div>
              )}

              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 bg-transparent text-white text-xs outline-none py-1.5 px-1 placeholder-zinc-500"
                  placeholder={replyingTo ? "Ketik balasan Anda..." : "Tulis pesan ke Adlan..."}
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-500 disabled:opacity-40 transition-all flex items-center justify-center flex-shrink-0 w-8 h-8"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* DROPDOWN MENU HEADER */}
      {isMenuOpen && (
        <div className="absolute top-16 right-6 w-56 bg-zinc-900/95 backdrop-blur-md rounded-xl p-2 shadow-2xl border border-zinc-800 z-50 animate-in fade-in zoom-in-95 duration-100">
          {isEditingName ? (
            <div className="p-2 space-y-2">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Ubah Nama</p>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black text-white text-xs p-2 rounded border border-zinc-800 outline-none focus:border-emerald-600"
              />
              <div className="flex gap-1.5">
                <button onClick={handleUpdateName} className="flex-1 bg-emerald-600 text-white text-[10px] py-1.5 rounded-lg font-bold hover:bg-emerald-500 transition-colors">Simpan</button>
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
    </main>
  );
}