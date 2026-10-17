// src/app/admin/chat/[id]/ChatRoomContent.tsx
"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
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

const ICONS = {
  back: "M15.75 19.5L8.25 12l7.5-7.5",
  close: "M6 18L18 6M6 6l12 12",
  reply: "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3",
  edit: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125",
  trash:
    "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
} as const;

function Icon({
  d,
  className = "w-4 h-4",
  strokeWidth = 1.8,
}: {
  d: string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

function ModalOption({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-semibold transition-colors ${
        danger
          ? "text-red-400 hover:bg-red-950/40"
          : "text-blue-100 hover:bg-blue-500/15"
      }`}
    >
      <Icon d={icon} className="h-4 w-4 flex-shrink-0" />
      {label}
    </button>
  );
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
  const [menuMessage, setMenuMessage] = useState<Message | null>(null); // pesan yang dipilih di modal
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Realtime status
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const prevCountRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Lacak apakah admin sedang berada di dekat bawah (untuk pesan baru yang masuk)
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // Scroll:
  // 1) Pertama kali obrolan terbuka -> langsung loncat ke paling bawah (tanpa animasi)
  // 2) Pesan baru -> halus ke bawah, hanya jika pesan dari admin sendiri atau admin memang di bawah
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || isLoading) return;

    if (!initialScrollDone.current) {
      el.scrollTop = el.scrollHeight;
      initialScrollDone.current = true;
      prevCountRef.current = messages.length;
      return;
    }

    const added = messages.length > prevCountRef.current;
    prevCountRef.current = messages.length;
    if (!added) return;

    const last = messages[messages.length - 1];
    if (last?.is_admin || isNearBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [isLoading, messages]);

  // Proteksi auth admin
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) router.push("/loginadmin");
    };
    checkUser();
  }, [router]);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    if (!menuMessage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuMessage(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuMessage]);

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
        const { error } = await supabase.from("messages").delete().in("id", idsToDelete);

        if (error) throw error;

        setMessages((prev) => prev.filter((msg) => !idsToDelete.includes(msg.id)));
      } catch (err) {
        console.error("Gagal memotong kapasitas pesan terlama:", err);
      }
    }
  }, []);

  const fetchRoomData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);

        // Profil user
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", senderId)
          .single();

        if (prof?.full_name) setProfileName(prof.full_name);
        if (prof?.avatar_url) setProfileAvatar(prof.avatar_url);

        // Pesan
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, sender_id, text, is_admin, created_at, updated_at, reply_to_id, is_read")
          .eq("sender_id", senderId)
          .order("created_at", { ascending: true });

        if (msgs) {
          const validMessages = msgs.filter(isValidMessage).map((msg) => ({
            ...msg,
            status: "sent" as const,
          }));
          setMessages(validMessages);
          await enforceMessageLimit(validMessages);
        }
      } catch (error) {
        console.error("Gagal memuat data chat:", error);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [senderId, isValidMessage, enforceMessageLimit]
  );

  // Setup realtime
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
      // 1. Perubahan data pesan
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
              return [...prev, { ...newMsg, status: "sent" as const }];
            });
            markMessagesAsRead();
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setMessages((prev) => prev.filter((m) => m.id !== deletedId));
            }
          }
        }
      )
      // 2. Presence (online/offline)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const isUserInRoom = Object.prototype.hasOwnProperty.call(state, "user");
        setIsUserOnline(isUserInRoom);
      })
      // 3. Broadcast (user sedang mengetik)
      .on("broadcast", { event: "typing" }, (payload) => {
        setIsUserTyping(!!payload.payload?.isTyping);
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

  // Kirim sinyal mengetik admin ke user
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
    return (
      messageDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) +
      " " +
      messageDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
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
    const firstConfirmation = confirm(
      `Apakah Anda yakin ingin menghapus SEMUA pesan dengan ${profileName}?`
    );
    if (!firstConfirmation) return;

    const secondConfirmation = confirm(
      "Tindakan ini permanen dan riwayat obrolan tidak dapat dikembalikan. Lanjutkan?"
    );
    if (!secondConfirmation) return;

    try {
      const { error } = await supabase.from("messages").delete().eq("sender_id", senderId);

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
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, text: editText } : msg))
      );
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
    <div className="flex h-full flex-col overflow-hidden text-blue-100 antialiased">
      {/* HEADER */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-blue-400/15 bg-linear-to-r from-blue-700/30 to-cyan-500/10 p-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* Tombol kembali: panah < saja (hanya di HP) */}
          <Link
            href="/admin/chat"
            aria-label="Kembali"
            className="-ml-1 rounded-full p-2 text-blue-200 transition duration-200 hover:bg-blue-500/15 hover:text-white active:scale-90 md:hidden"
          >
            <Icon d={ICONS.back} className="h-5 w-5" strokeWidth={2.2} />
          </Link>

          {/* Foto profil */}
          <div className="relative flex-shrink-0">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileAvatar}
                alt={profileName}
                className="h-9 w-9 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-400 text-xs font-bold uppercase text-white">
                {profileName.charAt(0)}
              </div>
            )}

            {/* Indikator online/offline */}
            <span
              className={`absolute bottom-0 right-0 inline-block h-2.5 w-2.5 rounded-full border-2 border-[#040a16] transition-colors duration-300 ${
                isUserOnline ? "bg-emerald-500" : "bg-blue-900"
              }`}
            ></span>
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold tracking-wide text-white">{profileName}</h2>
            <p className="mt-0.5 min-h-[12px] text-[10px] font-medium tracking-wide">
              {isUserTyping ? (
                <span className="animate-pulse text-cyan-300">sedang mengetik...</span>
              ) : isUserOnline ? (
                <span className="text-emerald-500">online</span>
              ) : (
                <span className="text-blue-300/70">offline</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleClearAllMessages}
          title="Hapus semua pesan"
          className="cursor-pointer rounded-full p-2 text-blue-300/80 transition duration-200 hover:bg-red-950/40 hover:text-red-300 active:scale-90"
        >
          <Icon d={ICONS.trash} className="h-4 w-4" />
          <span className="sr-only">Hapus Semua Pesan</span>
        </button>
      </header>

      {/* AREA PESAN */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-biru flex-1 space-y-4 overflow-y-auto p-4 md:p-6"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-xs font-medium uppercase tracking-widest text-blue-300/60">
            Sinkronisasi...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs font-medium italic text-blue-300/60">
            Tidak ada pesan di obrolan ini.
          </div>
        ) : (
          messages.map((msg) => {
            const repliedMsg = getRepliedMessage(msg.reply_to_id);

            return (
              <div
                key={msg.id}
                className={`flex ${msg.is_admin ? "justify-end" : "justify-start"} items-end gap-2`}
              >
                <div
                  className={`flex w-full max-w-[85%] flex-col sm:max-w-[70%] ${
                    msg.is_admin ? "items-end" : "items-start"
                  }`}
                >
                  {editingId === msg.id ? (
                    <div className="flex w-full gap-2 rounded-2xl border border-blue-400/30 bg-blue-950/80 p-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 rounded-xl border border-blue-400/20 bg-blue-950/60 px-3 py-1.5 text-xs text-white outline-none transition focus:border-cyan-300/70"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditMessage(msg.id)}
                        className="cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white transition duration-200 hover:from-blue-500 hover:to-cyan-400 active:scale-95"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                        className="cursor-pointer rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 transition duration-200 hover:bg-blue-500/20 active:scale-95"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex max-w-full flex-col">
                      {repliedMsg && (
                        <div className="mb-[-4px] max-w-full select-none rounded-t-xl border-l-2 border-cyan-300/60 bg-blue-950/80 px-3 py-1 text-[11px] text-blue-200/80">
                          <span className="block truncate text-[9px] font-bold text-cyan-300/80">
                            @{repliedMsg.is_admin ? "Anda" : profileName}
                          </span>
                          <p className="mt-0.5 truncate text-[10px] text-blue-200/80">{repliedMsg.text}</p>
                        </div>
                      )}

                      {/* Klik bubble -> buka modal pilihan */}
                      <div
                        onClick={() => {
                          if (msg.status === "sending") return;
                          setMenuMessage(msg);
                        }}
                        className={`cursor-pointer select-text break-words p-3 px-4 text-xs leading-relaxed transition-colors ${
                          msg.is_admin
                            ? `bg-linear-to-br from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 ${
                                repliedMsg ? "rounded-b-xl rounded-tl-xl" : "rounded-2xl rounded-tr-none"
                              }`
                            : `border border-blue-400/20 bg-blue-950/80 text-blue-50 hover:bg-blue-900/80 ${
                                repliedMsg ? "rounded-b-xl rounded-tr-xl" : "rounded-2xl rounded-tl-none"
                              }`
                        }`}
                      >
                        {msg.text}
                      </div>

                      <div
                        className={`pointer-events-none mt-1 flex select-none items-center gap-1 px-1 font-mono text-[10px] text-blue-300/70 ${
                          msg.is_admin ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span>{msg.updated_at ? formatMessageTime(msg.updated_at) : ""}</span>
                        {msg.is_admin && (
                          <span className="ml-0.5 inline-flex">
                            {msg.status === "sending" ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-3 w-3 text-blue-300/60"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className={`h-3.5 w-3.5 ${msg.is_read ? "text-cyan-200" : "text-blue-200/60"}`}
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                  clipRule="evenodd"
                                />
                                <path
                                  fillRule="evenodd"
                                  d="M13.204 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.894 1.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                  clipRule="evenodd"
                                />
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
          })
        )}
      </div>

      {/* FORM INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="flex-shrink-0 border-t border-blue-400/15 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex max-w-4xl flex-col overflow-hidden rounded-2xl border border-blue-400/20 bg-blue-950/60 transition focus-within:border-cyan-300/60">
          {replyingTo && (
            <div className="flex items-center justify-between bg-blue-500/10 px-4 py-1.5">
              <div className="truncate border-l-2 border-cyan-300 pl-2 pr-4 text-left">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-blue-200/80">
                  Membalas {replyingTo.is_admin ? "Anda" : profileName}
                </span>
                <span className="mt-0.5 block truncate text-[11px] italic text-blue-200/80">
                  {replyingTo.text}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                aria-label="Batalkan balasan"
                className="p-1 text-blue-300/70 hover:text-blue-100"
              >
                <Icon d={ICONS.close} className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5">
            <input
              value={inputMessage}
              onChange={handleInputChange}
              className="flex-1 bg-transparent px-1 py-2 text-xs text-white outline-none placeholder:text-blue-300/40"
              placeholder={replyingTo ? "Tulis balasan..." : "Ketik pesan..."}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              aria-label="Kirim"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 p-2 text-white transition duration-200 hover:from-blue-500 hover:to-cyan-400 active:scale-90 disabled:cursor-not-allowed disabled:from-blue-900/60 disabled:to-blue-900/60 disabled:text-blue-300/40 disabled:active:scale-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {/* MODAL PILIHAN PESAN (tanpa blur: overlay solid supaya ringan) */}
      {menuMessage && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 md:items-center"
          onClick={() => setMenuMessage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pilihan pesan"
            className="w-full max-w-xs rounded-3xl border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="truncate px-3 pb-2 pt-2 text-[11px] text-blue-300/70">{menuMessage.text}</p>

            <ModalOption
              icon={ICONS.reply}
              label="Balas"
              onClick={() => {
                setReplyingTo(menuMessage);
                setMenuMessage(null);
              }}
            />

            {menuMessage.is_admin && (
              <>
                <ModalOption
                  icon={ICONS.edit}
                  label="Edit"
                  onClick={() => {
                    setEditingId(menuMessage.id);
                    setEditText(menuMessage.text);
                    setMenuMessage(null);
                  }}
                />
                <ModalOption
                  icon={ICONS.trash}
                  label="Hapus"
                  danger
                  onClick={() => {
                    const id = menuMessage.id;
                    setMenuMessage(null);
                    handleDeleteMessage(id);
                  }}
                />
              </>
            )}

            <ModalOption icon={ICONS.close} label="Batal" onClick={() => setMenuMessage(null)} />
          </div>
        </div>
      )}
    </div>
  );
}