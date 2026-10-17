// src/app/admin/chat/[id]/ChatRoomContent.tsx
"use client";

import { memo, useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ChatAttachment from "@/app/components/chat/ChatAttachment";
import {
  removeChatAttachments,
  removeChatAttachment,
  uploadChatAttachment,
} from "@/lib/chat-attachments";

interface Message {
  id: string;
  sender_id: string;
  text: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  reply_to_id?: string | null;
  is_read: boolean;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
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

/* ---------------------------------------------------------------
   UTILITAS RINGAN
---------------------------------------------------------------- */

// Formatter dibuat sekali (membuat Intl di setiap render sangat berat di HP lawas)
const FORMAT_JAM = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });

// Pesan dimuat per halaman: yang terbaru dulu, yang lebih lama saat di-scroll ke atas
const UKURAN_HALAMAN_PESAN = 30;
const KOLOM_PESAN =
  "id, sender_id, text, is_admin, created_at, updated_at, reply_to_id, is_read, attachment_path, attachment_name, attachment_type, attachment_size";

// Batas simpanan per obrolan (aturan lama dipertahankan): jika lebih dari BATAS_PESAN,
// HAPUS_SEKALI pesan tertua dihapus dari database.
const BATAS_PESAN = 100;
const HAPUS_SEKALI = 20;

function formatWaktuPesan(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (d.toDateString() === new Date().toDateString()) return FORMAT_JAM.format(d);
  return `${FORMAT_TANGGAL.format(d)} ${FORMAT_JAM.format(d)}`;
}

function isValidMessage(item: any): item is Message {
  return (
    typeof item?.id === "string" &&
    typeof item?.sender_id === "string" &&
    typeof item?.text === "string" &&
    typeof item?.is_admin === "boolean" &&
    typeof item?.created_at === "string" &&
    typeof item?.updated_at === "string" &&
    typeof item?.is_read === "boolean"
  );
}

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
        danger ? "text-red-400 hover:bg-red-950/40" : "text-blue-100 hover:bg-blue-500/15"
      }`}
    >
      <Icon d={icon} className="h-4 w-4 flex-shrink-0" />
      {label}
    </button>
  );
}

/* ---------------------------------------------------------------
   BARIS EDIT (teks edit disimpan lokal di sini, bukan di komponen induk,
   jadi mengetik tidak merender ulang seluruh daftar pesan)
---------------------------------------------------------------- */

const EditRow = memo(function EditRow({
  id,
  initialText,
  onSave,
  onCancel,
}: {
  id: string;
  initialText: string;
  onSave: (id: string, text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initialText);

  return (
    <div className="flex w-full gap-2 rounded-2xl border border-blue-400/30 bg-blue-950/80 p-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 rounded-xl border border-blue-400/20 bg-blue-950/60 px-3 py-1.5 text-xs text-white outline-none transition focus:border-cyan-300/70"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onSave(id, text)}
        className="cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white transition duration-200 hover:from-blue-500 hover:to-cyan-400 active:scale-95"
      >
        OK
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 transition duration-200 hover:bg-blue-500/20 active:scale-95"
      >
        Batal
      </button>
    </div>
  );
});

/* ---------------------------------------------------------------
   GELEMBUNG PESAN (memo: hanya dirender ulang kalau pesannya sendiri berubah)
---------------------------------------------------------------- */

const MessageBubble = memo(function MessageBubble({
  msg,
  repliedMsg,
  profileName,
  isEditing,
  onOpenMenu,
  onSaveEdit,
  onCancelEdit,
  onDeleteAttachment,
}: {
  msg: Message;
  repliedMsg: Message | null;
  profileName: string;
  isEditing: boolean;
  onOpenMenu: (msg: Message) => void;
  onSaveEdit: (id: string, text: string) => void;
  onCancelEdit: () => void;
  onDeleteAttachment: (message: Message) => Promise<boolean>;
}) {
  return (
    <div className={`flex ${msg.is_admin ? "justify-end" : "justify-start"} items-end gap-2`}>
      <div
        className={`flex w-full max-w-[85%] flex-col sm:max-w-[70%] ${
          msg.is_admin ? "items-end" : "items-start"
        }`}
      >
        {isEditing ? (
          <EditRow id={msg.id} initialText={msg.text} onSave={onSaveEdit} onCancel={onCancelEdit} />
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
            {msg.text && (
              <div
                onClick={() => {
                  if (msg.status === "sending") return;
                  onOpenMenu(msg);
                }}
                className={`cursor-pointer select-text break-words p-3 px-4 text-xs leading-relaxed ${
                  msg.is_admin
                    ? `bg-linear-to-br from-blue-600 to-cyan-500 text-white ${
                        repliedMsg ? "rounded-b-xl rounded-tl-xl" : "rounded-2xl rounded-tr-none"
                      }`
                    : `border border-blue-400/20 bg-blue-950/80 text-blue-50 ${
                        repliedMsg ? "rounded-b-xl rounded-tr-xl" : "rounded-2xl rounded-tl-none"
                      }`
                }`}
              >
                {msg.text}
              </div>
            )}
            {msg.attachment_path && (
              <ChatAttachment
                path={msg.attachment_path}
                name={msg.attachment_name || "Lampiran"}
                type={msg.attachment_type ?? null}
                onDelete={() => onDeleteAttachment(msg)}
              />
            )}

            <div
              className={`pointer-events-none mt-1 flex select-none items-center gap-1 px-1 font-mono text-[10px] text-blue-300/70 ${
                msg.is_admin ? "justify-end" : "justify-start"
              }`}
            >
              <span>{msg.updated_at ? formatWaktuPesan(msg.updated_at) : ""}</span>
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
});

/* ---------------------------------------------------------------
   KOTAK INPUT (teks ketikan disimpan lokal di sini, bukan di komponen induk:
   tiap ketukan hanya merender kotak ini, bukan seluruh daftar pesan)
---------------------------------------------------------------- */

const MessageInput = memo(function MessageInput({
  replyingTo,
  profileName,
  onSend,
  onTyping,
  onCancelReply,
}: {
  replyingTo: Message | null;
  profileName: string;
  onSend: (text: string, file: File | null) => Promise<boolean>;
  onTyping: () => void;
  onCancelReply: () => void;
}) {
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = value;
    const file = selectedFile;
    if (!text.trim() && !file) return;

    setValue("");
    setSelectedFile(null);
    const ok = await onSend(text, file);
    // Gagal terkirim: kembalikan teks (tanpa menimpa kalau admin sudah mengetik lagi)
    if (!ok) {
      setValue((sekarang) => sekarang || text);
      if (file) setSelectedFile((sekarang) => sekarang || file);
    }
  };

  return (
    <form
      onSubmit={submit}
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
              onClick={onCancelReply}
              aria-label="Batalkan balasan"
              className="p-1 text-blue-300/70 hover:text-blue-100"
            >
              <Icon d={ICONS.close} className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        )}

        {selectedFile && (
          <div className="flex items-center justify-between gap-3 border-b border-blue-400/15 bg-blue-500/10 px-4 py-2">
            <span className="flex min-w-0 items-center gap-2 truncate text-xs text-blue-100">
              <Icon d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" />
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              aria-label="Hapus lampiran pilihan"
              className="shrink-0 text-xs text-blue-200 hover:text-white"
            >
              Hapus
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Lampirkan file atau gambar"
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl text-blue-200 transition hover:bg-blue-500/20 hover:text-cyan-200"
          >
            <Icon d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" />
          </button>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onTyping();
            }}
            className="flex-1 bg-transparent px-1 py-2 text-xs text-white outline-none placeholder:text-blue-300/40"
            placeholder={replyingTo ? "Tulis balasan..." : "Ketik pesan..."}
          />
          <button
            type="submit"
            disabled={!value.trim() && !selectedFile}
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
  );
});

/* ---------------------------------------------------------------
   KOMPONEN UTAMA
---------------------------------------------------------------- */

export default function ChatRoomContent({ chatUserId }: { chatUserId: string }) {
  const router = useRouter();
  const senderId = chatUserId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [profileName, setProfileName] = useState("User");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuMessage, setMenuMessage] = useState<Message | null>(null); // pesan yang dipilih di modal
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Realtime status
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Infinite scroll ke atas
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const prevCountRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const channelRef = useRef<any>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const loadingOlderRef = useRef(false);
  // Posisi scroll sebelum pesan lama ditambahkan di atas, untuk menjaga tampilan tidak melompat
  const anchorRef = useRef<{ height: number; top: number } | null>(null);
  // Pesan yang dibalas tapi belum termuat (lebih lama dari halaman yang tampil)
  const replyCacheRef = useRef(new Map<string, Message>());
  const [, setReplyTick] = useState(0);

  // Salinan terbaru daftar pesan di luar render, supaya logika kirim/batas pesan
  // tidak perlu efek samping di dalam fungsi setState
  const messagesRef = useRef<Message[]>([]);
  const updateMessages = useCallback((fn: (prev: Message[]) => Message[]) => {
    const next = fn(messagesRef.current);
    if (next === messagesRef.current) return; // tidak berubah -> tidak render ulang
    messagesRef.current = next;
    setMessages(next);
  }, []);

  // Peta id -> pesan: mencari pesan yang dibalas jadi O(1), bukan find() untuk tiap pesan
  const messagesById = useMemo(() => {
    const map = new Map<string, Message>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

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

    // Pesan lama baru ditambahkan di atas: pertahankan posisi baca, jangan lompat
    if (anchorRef.current) {
      const { height, top } = anchorRef.current;
      anchorRef.current = null;
      el.scrollTop = el.scrollHeight - height + top;
      prevCountRef.current = messages.length;
      return;
    }

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

  // Batas pesan dihitung dari database (bukan dari pesan yang termuat), karena kini hanya sebagian yang dimuat
  const enforceMessageLimit = useCallback(async () => {
    try {
      const { count, error: errCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", senderId);
      if (errCount || (count ?? 0) <= BATAS_PESAN) return;

      const { data: tertua, error: errTertua } = await supabase
        .from("messages")
        .select("id, attachment_path")
        .eq("sender_id", senderId)
        .order("created_at", { ascending: true })
        .limit(HAPUS_SEKALI);
      if (errTertua || !tertua?.length) return;

      const ids = tertua.map((r) => r.id as string);
      await removeChatAttachments(
        tertua
          .map((r) => r.attachment_path)
          .filter((path): path is string => typeof path === "string")
      );
      const { error } = await supabase.from("messages").delete().in("id", ids);
      if (error) throw error;

      const hapus = new Set(ids);
      updateMessages((prev) => prev.filter((msg) => !hapus.has(msg.id)));
    } catch (err) {
      console.error("Gagal memotong kapasitas pesan terlama:", err);
    }
  }, [senderId, updateMessages]);

  // Ambil pesan yang dibalas tapi tidak ada di halaman yang termuat, supaya kutipan balasan tetap tampil
  const ambilBalasanHilang = useCallback(async (daftar: Message[]) => {
    const ada = new Set(messagesRef.current.map((m) => m.id));
    const ids = Array.from(
      new Set(
        daftar
          .map((m) => m.reply_to_id)
          .filter((id): id is string => !!id && !ada.has(id) && !replyCacheRef.current.has(id))
      )
    );
    if (ids.length === 0) return;

    const { data } = await supabase.from("messages").select(KOLOM_PESAN).in("id", ids);
    if (!data?.length) return;
    data.forEach((r) => replyCacheRef.current.set(r.id, r as Message));
    setReplyTick((t) => t + 1);
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

        // Hanya halaman terbaru (urut turun, lalu dibalik agar tampil dari lama ke baru)
        const { data: msgs } = await supabase
          .from("messages")
          .select(KOLOM_PESAN)
          .eq("sender_id", senderId)
          .order("created_at", { ascending: false })
          .limit(UKURAN_HALAMAN_PESAN);

        if (msgs) {
          const validMessages = msgs
            .filter(isValidMessage)
            .map((msg) => ({ ...msg, status: "sent" as const }))
            .reverse();
          updateMessages(() => validMessages);
          setHasOlder(msgs.length === UKURAN_HALAMAN_PESAN);
          void ambilBalasanHilang(validMessages);
          void enforceMessageLimit();
        }
      } catch (error) {
        console.error("Gagal memuat data chat:", error);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [senderId, enforceMessageLimit, ambilBalasanHilang, updateMessages]
  );

  // Infinite scroll: muat halaman pesan yang lebih lama
  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current) return;
    const oldest = messagesRef.current[0];
    if (!oldest) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(KOLOM_PESAN)
        .eq("sender_id", senderId)
        .lt("created_at", oldest.created_at)
        .order("created_at", { ascending: false })
        .limit(UKURAN_HALAMAN_PESAN);

      if (error) {
        setHasOlder(false);
        return;
      }

      const rows = data ?? [];
      setHasOlder(rows.length === UKURAN_HALAMAN_PESAN);

      const ada = new Set(messagesRef.current.map((m) => m.id));
      const baru = rows
        .filter(isValidMessage)
        .filter((m) => !ada.has(m.id))
        .map((m) => ({ ...m, status: "sent" as const }))
        .reverse();

      if (baru.length > 0) {
        const el = scrollRef.current;
        if (el) anchorRef.current = { height: el.scrollHeight, top: el.scrollTop };
        updateMessages((prev) => [...baru, ...prev]);
        void ambilBalasanHilang(baru);
      }
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [senderId, updateMessages, ambilBalasanHilang]);

  // Sentinel di paling atas daftar: begitu terlihat, muat pesan yang lebih lama.
  // Efek dibuat ulang setelah tiap pemuatan, jadi kalau masih terlihat akan lanjut memuat.
  useEffect(() => {
    const el = topSentinelRef.current;
    const root = scrollRef.current;
    if (isLoading || !hasOlder || loadingOlder || !el || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadOlder();
      },
      { root, rootMargin: "200px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading, hasOlder, loadingOlder, loadOlder]);

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

            updateMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, status: "sent" as const }];
            });
            markMessagesAsRead();
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            updateMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === updatedMsg.id);
              if (idx === -1) return prev;
              const lama = prev[idx];
              // Tidak ada yang berubah (mis. event balasan dari update sendiri) -> lewati
              if (
                lama.text === updatedMsg.text &&
                lama.is_read === updatedMsg.is_read &&
                lama.updated_at === updatedMsg.updated_at
              ) {
                return prev;
              }
              const next = prev.slice();
              next[idx] = { ...lama, ...updatedMsg };
              return next;
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (deletedId) {
              updateMessages((prev) =>
                prev.some((m) => m.id === deletedId) ? prev.filter((m) => m.id !== deletedId) : prev
              );
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
      // removeChannel (bukan sekadar unsubscribe) supaya channel lama tidak menumpuk di memori
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [senderId, fetchRoomData, markMessagesAsRead, updateMessages]);

  // Sinyal mengetik admin ke user: dibatasi maksimal sekali per 1,5 detik
  // (sebelumnya dikirim di setiap ketukan), lalu sinyal "berhenti" 2 detik setelah ketukan terakhir
  const handleTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      channel.send({ type: "broadcast", event: "typing", payload: { isTyping: true } });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      lastTypingSentRef.current = 0;
      channelRef.current?.send({ type: "broadcast", event: "typing", payload: { isTyping: false } });
    }, 2000);
  }, []);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    lastTypingSentRef.current = 0;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { isTyping: false } });
  }, []);

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Hapus pesan ini?")) return;

    try {
      const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select("attachment_path")
        .eq("id", messageId)
        .eq("sender_id", senderId)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (message?.attachment_path) {
        await removeChatAttachment(message.attachment_path);
      }

      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", senderId);
      if (error) throw error;

      updateMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error("Gagal menghapus pesan chat:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus pesan.");
    }
  };

  const handleRemoveAttachment = async (message: Message): Promise<boolean> => {
    if (!message.attachment_path) return false;
    if (!confirm("Hapus pesan ini beserta file atau gambarnya?")) return false;
    try {
      await removeChatAttachment(message.attachment_path);
    } catch (error) {
      console.error("Gagal menghapus file dari Supabase Storage:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus file dari Storage.");
      return false;
    }
    const { data, error } = await supabase
      .from("messages")
      .delete()
      .eq("id", message.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Gagal menghapus pesan setelah menghapus lampiran:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      alert(`File sudah dihapus, tetapi pesan tidak terhapus: ${error.message}`);
      return false;
    }

    if (!data) {
      console.error(
        "File sudah dihapus, tetapi pesan tidak ditemukan atau DELETE ditolak oleh policy RLS."
      );
      alert("File sudah dihapus, tetapi pesan tidak terhapus. Periksa policy DELETE pada tabel messages.");
      return false;
    }

    updateMessages((prev) => prev.filter((item) => item.id !== message.id));
    setMenuMessage(null);
    return true;
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
      const { data: messagesToDelete, error: fetchError } = await supabase
        .from("messages")
        .select("attachment_path")
        .eq("sender_id", senderId);
      if (fetchError) throw fetchError;
      await removeChatAttachments(
        (messagesToDelete ?? [])
          .map((message) => message.attachment_path)
          .filter((path): path is string => typeof path === "string")
      );

      const { error } = await supabase.from("messages").delete().eq("sender_id", senderId);

      if (error) throw error;

      updateMessages(() => []);
      alert("Semua riwayat pesan berhasil dibersihkan.");
    } catch (error) {
      console.error("Gagal membersihkan pesan:", error);
      alert("Gagal menghapus semua pesan. Silakan coba lagi.");
    }
  };

  const handleEditMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (!newText.trim()) return;
      const { error } = await supabase.from("messages").update({ text: newText }).eq("id", messageId);
      if (error) {
        alert("Gagal mengubah pesan");
      } else {
        updateMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, text: newText } : msg)));
        setEditingId(null);
      }
    },
    [updateMessages]
  );

  // Mengembalikan true jika berhasil terkirim (false -> kotak input mengembalikan teksnya)
  const handleSend = useCallback(
    async (text: string, file: File | null): Promise<boolean> => {
      stopTyping();

      const currentReplyId = replyingTo?.id || null;
      setReplyingTo(null);

      const tempId = `temp-${Date.now()}`;
      const sekarang = new Date().toISOString();
      const optimisticMessage: Message = {
        id: tempId,
        sender_id: senderId,
        text,
        is_admin: true,
        reply_to_id: currentReplyId,
        is_read: false,
        created_at: sekarang,
        updated_at: sekarang,
        status: "sending",
      };

      updateMessages((prev) => [...prev, optimisticMessage]);

      let uploadedAttachment: Awaited<ReturnType<typeof uploadChatAttachment>> | null = null;
      try {
        if (file) {
          uploadedAttachment = await uploadChatAttachment(file, senderId);
          updateMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId ? { ...msg, ...uploadedAttachment } : msg
            )
          );
        }

        const { data, error } = await supabase
          .from("messages")
          .insert({
            sender_id: senderId,
            text: text.trim(),
            is_admin: true,
            reply_to_id: currentReplyId,
            is_read: false,
            ...(uploadedAttachment ?? {}),
          })
          .select()
          .single();

        if (error || !data) {
          updateMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          if (uploadedAttachment) {
            await removeChatAttachment(uploadedAttachment.attachment_path);
          }
          if (error) console.error("Gagal menyimpan pesan chat:", error);
          alert("Gagal mengirim pesan atau lampiran.");
          return false;
        }

        updateMessages((prev) =>
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
        // Dipanggil di luar fungsi setState (sebelumnya di dalamnya, sehingga bisa jalan dua kali)
        void enforceMessageLimit();
        return true;
      } catch (error) {
        updateMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        if (uploadedAttachment) {
          try {
            await removeChatAttachment(uploadedAttachment.attachment_path);
          } catch (cleanupError) {
            console.error("Gagal membersihkan lampiran yang gagal dikirim:", cleanupError);
          }
        }
        console.error("Gagal mengirim pesan chat:", error);
        alert(error instanceof Error ? error.message : "Gagal mengirim pesan.");
        return false;
      }
    },
    [replyingTo, senderId, stopTyping, updateMessages, enforceMessageLimit]
  );

  // Handler stabil untuk item memo
  const openMenu = useCallback((msg: Message) => setMenuMessage(msg), []);
  const cancelEdit = useCallback(() => setEditingId(null), []);
  const cancelReply = useCallback(() => setReplyingTo(null), []);

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
                decoding="async"
                width={36}
                height={36}
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-400 text-xs font-bold uppercase text-white">
                {profileName.charAt(0)}
              </div>
            )}

            {/* Indikator online/offline */}
            <span
              className={`absolute bottom-0 right-0 inline-block h-2.5 w-2.5 rounded-full border-2 border-[#040a16] ${
                isUserOnline ? "bg-emerald-500" : "bg-blue-900"
              }`}
            ></span>
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold tracking-wide text-white">{profileName}</h2>
            <p className="mt-0.5 min-h-[12px] text-[10px] font-medium tracking-wide">
              {isUserTyping ? (
                <span className="text-cyan-300">sedang mengetik...</span>
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
          <>
            {/* Pemicu infinite scroll ke atas */}
            {hasOlder && <div ref={topSentinelRef} aria-hidden="true" className="h-px" />}
            {loadingOlder && (
              <div className="text-center text-[11px] italic text-blue-300/60">Memuat pesan lama...</div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                repliedMsg={
                  msg.reply_to_id
                    ? messagesById.get(msg.reply_to_id) ?? replyCacheRef.current.get(msg.reply_to_id) ?? null
                    : null
                }
                profileName={profileName}
                isEditing={editingId === msg.id}
                onOpenMenu={openMenu}
                onSaveEdit={handleEditMessage}
                onCancelEdit={cancelEdit}
                onDeleteAttachment={handleRemoveAttachment}
              />
            ))}
          </>
        )}
      </div>

      {/* FORM INPUT */}
      <MessageInput
        replyingTo={replyingTo}
        profileName={profileName}
        onSend={handleSend}
        onTyping={handleTyping}
        onCancelReply={cancelReply}
      />

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

            {menuMessage.attachment_path && (
              <ModalOption
                icon={ICONS.trash}
                label="Hapus pesan"
                danger
                onClick={() => void handleRemoveAttachment(menuMessage)}
              />
            )}

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