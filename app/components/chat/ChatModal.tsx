"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

/** Dipakai halaman utama: jika di-set, chat dibuka lagi setelah halaman dimuat ulang (mis. login Google). */
export const CHAT_REOPEN_KEY = "amr-chat-reopen";

/** Jumlah pesan yang dimuat per halaman (infinite scroll). */
const UKURAN_HALAMAN = 20;

/** Jarak (px) dari atas daftar saat pesan lama mulai dimuat. */
const AMBANG_ATAS = 80;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

interface PratinjauBalasan {
  id: string;
  text: string;
  is_admin: boolean;
}

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  /** Opsional: dipanggil saat pengguna belum login dan menekan tombol "Login". */
  onMasuk?: () => void;
}

const KOLOM_PESAN =
  "id, sender_id, text, is_admin, created_at, updated_at, reply_to_id, is_read";

/* ---------- Ikon SVG ---------- */

function Ikon({
  className = "h-4 w-4",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Ikon>
  );
}

function IconKirim({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </Ikon>
  );
}

function IconChevron({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Ikon>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Ikon>
  );
}

function IconPen({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Ikon>
  );
}

function IconLogin({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </Ikon>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    </Ikon>
  );
}

function IconBalas({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="m9 14-5-5 5-5" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </Ikon>
  );
}

function IconSampah({ className }: { className?: string }) {
  return (
    <Ikon className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Ikon>
  );
}

function IconCentang({
  className,
  ganda = false,
}: {
  className?: string;
  ganda?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
      {ganda && (
        <path
          fillRule="evenodd"
          d="M13.204 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.894 1.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}

/* ---------- SVG dekoratif ---------- */

function Dekor({
  jenis,
  className = "",
}: {
  jenis: "cincin" | "titik" | "gelombang";
  className?: string;
}) {
  const umum = {
    viewBox: "0 0 200 200",
    className: `pointer-events-none ${className}`,
    "aria-hidden": true,
  } as const;

  if (jenis === "cincin") {
    return (
      <svg {...umum} fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="100" cy="100" r="30" />
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="90" />
      </svg>
    );
  }

  if (jenis === "titik") {
    return (
      <svg {...umum} fill="currentColor">
        {[20, 60, 100, 140, 180].flatMap((x) =>
          [20, 60, 100, 140, 180].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" />
          ))
        )}
      </svg>
    );
  }

  return (
    <svg
      {...umum}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {[40, 80, 120, 160].map((y) => (
        <path
          key={y}
          d={`M0 ${y} Q25 ${y - 30} 50 ${y} T100 ${y} T150 ${y} T200 ${y}`}
        />
      ))}
    </svg>
  );
}

/* ---------- Tombol kartu untuk dropdown bubble ---------- */

function ItemMenu({
  ikon,
  onClick,
  children,
  warnaIkon = "text-cyan-300",
}: {
  ikon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
  warnaIkon?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className="flex min-h-12 w-full cursor-pointer touch-manipulation items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-left text-sm font-semibold text-blue-100 transition duration-200 hover:border-cyan-300/50 hover:bg-blue-500/20 active:scale-95 active:bg-blue-500/30"
    >
      <span className={`shrink-0 ${warnaIkon}`}>{ikon}</span>
      {children}
    </button>
  );
}

/* ---------- Komponen utama ---------- */

export default function ChatModal({ open, onClose, onMasuk }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [memuat, setMemuat] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [replyMap, setReplyMap] = useState<Record<string, PratinjauBalasan>>({});

  // Edit nama profil
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Aksi bubble chat
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Konfirmasi hapus
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Status realtime
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomChannelRef = useRef<any>(null);
  const globalPresenceChannelRef = useRef<any>(null);

  // Kontrol scroll
  const scrollAwalRef = useRef(true);
  const scrollModeRef = useRef<"none" | "bottom">("none");
  const anchorRef = useRef<{ height: number; top: number } | null>(null);

  // Cermin state untuk dipakai di dalam callback async
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  const hasMoreRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const replyDimintaRef = useRef<Set<string>>(new Set());

  /* ---- Posisi scroll ---- */
  useIsoLayoutEffect(() => {
    if (!open || memuat || !user) return;
    const el = scrollRef.current;
    if (!el) return;

    if (scrollAwalRef.current) {
      // Pertama kali dibuka: langsung di pesan terakhir, tanpa animasi
      el.scrollTop = el.scrollHeight;
      scrollAwalRef.current = false;
      return;
    }

    if (anchorRef.current) {
      // Pesan lama ditambahkan di atas: pertahankan posisi baca
      const { height, top } = anchorRef.current;
      el.scrollTop = el.scrollHeight - height + top;
      anchorRef.current = null;
      return;
    }

    if (scrollModeRef.current === "bottom") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      scrollModeRef.current = "none";
    }
  }, [messages, memuat, user, open]);

  /* ---- Kunci scroll body + Escape ---- */
  useEffect(() => {
    if (!open) return;

    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const tekan = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteTargetId) {
        setDeleteTargetId(null);
      } else if (isMenuOpen) {
        setIsMenuOpen(false);
      } else if (openMenuId) {
        setOpenMenuId(null);
      } else if (editingId) {
        // Escape saat edit ditangani oleh input edit
      } else {
        onClose();
      }
    };

    document.addEventListener("keydown", tekan);
    return () => {
      document.removeEventListener("keydown", tekan);
      document.body.style.overflow = overflowLama;
    };
  }, [open, onClose, deleteTargetId, isMenuOpen, openMenuId, editingId]);

  /* ---- Tutup dropdown bubble saat klik di luar ---- */
  useEffect(() => {
    if (!openMenuId) return;
    const klikLuar = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Klik pada bubble ditangani sendiri oleh bubble (klik = buka, dobel klik = tutup)
      if (target.closest("[data-bubble]")) return;
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", klikLuar);
    return () => document.removeEventListener("mousedown", klikLuar);
  }, [openMenuId]);

  /* ---- Pastikan dropdown bubble terlihat penuh ---- */
  useEffect(() => {
    if (!openMenuId) return;
    const frame = requestAnimationFrame(() => {
      chatMenuRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [openMenuId]);

  /* ---- Tutup dropdown header saat klik di luar ---- */
  useEffect(() => {
    if (!isMenuOpen) return;
    const klikLuar = (event: MouseEvent) => {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
        setIsEditingName(false);
      }
    };
    document.addEventListener("mousedown", klikLuar);
    return () => document.removeEventListener("mousedown", klikLuar);
  }, [isMenuOpen]);

  /* ---- Fokus tombol konfirmasi hapus ---- */
  useEffect(() => {
    if (deleteTargetId) confirmButtonRef.current?.focus();
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
        .update({ is_read: true })
        .eq("sender_id", userId)
        .eq("is_admin", true)
        .eq("is_read", false);
    } catch (error) {
      console.error("Gagal memperbarui status terbaca customer:", error);
    }
  }, []);

  /** Muat halaman pesan terbaru (dipakai saat modal pertama dibuka). */
  const fetchPesanTerbaru = useCallback(
    async (userId: string) => {
      try {
        const { data: msgs } = await supabase
          .from("messages")
          .select(KOLOM_PESAN)
          .eq("sender_id", userId)
          .order("created_at", { ascending: false })
          .limit(UKURAN_HALAMAN);

        if (msgs) {
          const valid = msgs
            .filter(isValidMessage)
            .reverse()
            .map((msg) => ({ ...msg, status: "sent" as const }));
          setMessages(valid);
          const masihAda = msgs.length === UKURAN_HALAMAN;
          hasMoreRef.current = masihAda;
          setHasMore(masihAda);
        }
      } catch (error) {
        console.error("Gagal memuat pesan:", error);
      }
    },
    [isValidMessage]
  );

  /** Muat halaman pesan yang lebih lama (dipicu saat scroll mendekati atas). */
  const loadOlder = useCallback(async () => {
    const userId = user?.id as string | undefined;
    if (!userId || loadingOlderRef.current || !hasMoreRef.current) return;

    const terlama = messagesRef.current.find((m) => m.status !== "sending");
    if (!terlama) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);

    try {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select(KOLOM_PESAN)
        .eq("sender_id", userId)
        .lt("created_at", terlama.created_at)
        .order("created_at", { ascending: false })
        .limit(UKURAN_HALAMAN);

      if (error) throw error;

      const masihAda = (msgs?.length ?? 0) === UKURAN_HALAMAN;
      hasMoreRef.current = masihAda;
      setHasMore(masihAda);

      const lama = (msgs ?? [])
        .filter(isValidMessage)
        .reverse()
        .map((msg) => ({ ...msg, status: "sent" as const }));

      const idAda = new Set(messagesRef.current.map((m) => m.id));
      const baru = lama.filter((m) => !idAda.has(m.id));

      if (baru.length > 0) {
        const el = scrollRef.current;
        if (el) {
          anchorRef.current = { height: el.scrollHeight, top: el.scrollTop };
        }
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return [...baru.filter((m) => !ids.has(m.id)), ...prev];
        });
      }
    } catch (error) {
      console.error("Gagal memuat pesan lama:", error);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [user, isValidMessage]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || scrollAwalRef.current) return;
    if (el.scrollTop <= AMBANG_ATAS) void loadOlder();
  };

  /* ---- Jika isi belum memenuhi layar, lanjut muat pesan lama ---- */
  useEffect(() => {
    if (!open || memuat || !user || !hasMore || loadingOlder) return;
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 1) void loadOlder();
  }, [messages, open, memuat, user, hasMore, loadingOlder, loadOlder]);

  /* ---- Ambil pratinjau pesan yang dibalas tapi belum termuat ---- */
  useEffect(() => {
    if (!open || !user) return;

    const idAda = new Set(messages.map((m) => m.id));
    const hilang = Array.from(
      new Set(
        messages
          .map((m) => m.reply_to_id)
          .filter(
            (id): id is string =>
              !!id &&
              !idAda.has(id) &&
              !replyMap[id] &&
              !replyDimintaRef.current.has(id)
          )
      )
    );
    if (hilang.length === 0) return;

    hilang.forEach((id) => replyDimintaRef.current.add(id));

    supabase
      .from("messages")
      .select("id, text, is_admin")
      .in("id", hilang)
      .then(({ data }) => {
        if (!data) return;
        setReplyMap((prev) => {
          const next = { ...prev };
          for (const row of data as PratinjauBalasan[]) next[row.id] = row;
          return next;
        });
      });
  }, [messages, open, user, replyMap]);

  /* ---- Mesin utama realtime: hanya aktif saat modal terbuka ---- */
  useEffect(() => {
    if (!open) return;

    let batal = false;

    // Reset setiap kali modal dibuka
    setMemuat(true);
    setMessages([]);
    setHasMore(true);
    hasMoreRef.current = true;
    loadingOlderRef.current = false;
    setLoadingOlder(false);
    setReplyMap({});
    replyDimintaRef.current = new Set();
    scrollAwalRef.current = true;
    scrollModeRef.current = "none";
    anchorRef.current = null;
    setOpenMenuId(null);

    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (batal) return;

      if (!authUser) {
        setUser(null);
        setMemuat(false);
        return;
      }
      setUser(authUser);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (batal) return;

      setProfile(prof);
      setNewName(prof?.full_name || "");

      await fetchPesanTerbaru(authUser.id);
      await markMessagesAsRead(authUser.id);

      if (batal) return;
      setMemuat(false);

      // 1. Channel global: status online admin
      const globalChannel = supabase.channel("sidebar-global-realtime", {
        config: { presence: { key: authUser.id } },
      });
      globalPresenceChannelRef.current = globalChannel;

      globalChannel
        .on("presence", { event: "sync" }, () => {
          const state = globalChannel.presenceState();

          const hasAdmin = Object.keys(state).some((key) => {
            if (key === "admin-sidebar") return true;
            const dataList = state[key];
            return (
              Array.isArray(dataList) &&
              dataList.some(
                (meta: any) =>
                  typeof meta === "object" &&
                  meta !== null &&
                  "role" in meta &&
                  meta.role === "admin"
              )
            );
          });

          setIsAdminOnline(hasAdmin);
          if (!hasAdmin) setIsAdminTyping(false);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await globalChannel.track({
              user_id: authUser.id,
              online_at: new Date().toISOString(),
            });
          }
        });

      // 2. Channel room: pesan & mengetik (diterapkan langsung, tanpa memuat ulang semua data)
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
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new;
              // Pesan milik sendiri sudah ditangani secara optimistis
              if (!isValidMessage(row) || !row.is_admin) return;

              const el = scrollRef.current;
              const dekatBawah = el
                ? el.scrollHeight - el.scrollTop - el.clientHeight < 160
                : true;
              if (dekatBawah) scrollModeRef.current = "bottom";

              setMessages((prev) =>
                prev.some((m) => m.id === row.id)
                  ? prev
                  : [...prev, { ...row, status: "sent" as const }]
              );
              markMessagesAsRead(authUser.id);
            } else if (payload.eventType === "UPDATE") {
              const row = payload.new;
              if (!row?.id) return;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === row.id
                    ? {
                        ...m,
                        text: typeof row.text === "string" ? row.text : m.text,
                        is_read:
                          typeof row.is_read === "boolean"
                            ? row.is_read
                            : m.is_read,
                        updated_at: row.updated_at ?? m.updated_at,
                      }
                    : m
                )
              );
            } else if (payload.eventType === "DELETE") {
              const id = payload.old?.id;
              if (id) setMessages((prev) => prev.filter((m) => m.id !== id));
            }
          }
        )
        .on("broadcast", { event: "typing" }, (payload: any) => {
          setIsAdminTyping(!!payload.payload.isTyping);
        })
        .subscribe();
    };

    init();

    return () => {
      batal = true;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (roomChannelRef.current) {
        supabase.removeChannel(roomChannelRef.current);
        roomChannelRef.current = null;
      }
      if (globalPresenceChannelRef.current) {
        supabase.removeChannel(globalPresenceChannelRef.current);
        globalPresenceChannelRef.current = null;
      }
      setIsAdminOnline(false);
      setIsAdminTyping(false);
    };
  }, [open, fetchPesanTerbaru, markMessagesAsRead, isValidMessage]);

  /* ---- Handler ---- */

  const kirimSinyalMengetik = (isTyping: boolean) => {
    roomChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { isTyping },
    });

    if (globalPresenceChannelRef.current && user?.id) {
      globalPresenceChannelRef.current.send({
        type: "broadcast",
        event: "typing_global",
        payload: { userId: user.id, isTyping },
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!roomChannelRef.current) return;

    kirimSinyalMengetik(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      kirimSinyalMengetik(false);
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
    kirimSinyalMengetik(false);

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

    scrollModeRef.current = "bottom";
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
        })
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
    } catch {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    setMessages([]);
    setUser(null);
    setProfile(null);
    onClose();
  };

  const handleMasuk = () => {
    // Jika login lewat Google (redirect), chat akan dibuka lagi otomatis
    try {
      sessionStorage.setItem(CHAT_REOPEN_KEY, "1");
    } catch {
      /* abaikan */
    }
    onClose();
    onMasuk?.();
  };

  const formatMessageTime = (updatedAt: string | null | undefined) => {
    if (!updatedAt) return "Waktu tidak diketahui";
    const messageDate = new Date(updatedAt);
    if (isNaN(messageDate.getTime())) return "Waktu tidak diketahui";

    const today = new Date();
    const jam = messageDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (messageDate.toDateString() === today.toDateString()) return jam;

    return (
      messageDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }) +
      " " +
      jam
    );
  };

  const getRepliedMessage = (
    replyToId: string | null | undefined
  ): PratinjauBalasan | null => {
    if (!replyToId) return null;
    const ditemukan = messages.find((m) => m.id === replyToId);
    if (ditemukan) return ditemukan;
    return replyMap[replyToId] ?? null;
  };

  if (!open) return null;

  const namaTampil =
    profile?.full_name || user?.user_metadata?.full_name || "Customer";
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const inisial = (namaTampil || "C").trim().charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chat dengan Adlan"
        className="relative flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950 sm:h-[85vh] sm:rounded-[2rem]"
      >
        {/* ===== HEADER ===== */}
        <header className="relative z-20 shrink-0 bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400 px-5 py-4">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Dekor
              jenis="cincin"
              className="absolute -right-14 -top-16 h-52 w-52 text-white/20"
            />
            <Dekor
              jenis="titik"
              className="absolute -bottom-8 left-[40%] h-24 w-24 text-white/10"
            />
          </div>

          <div className="relative flex items-center justify-between gap-3">
            {/* Identitas admin */}
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white/40 bg-blue-900">
                <Image
                  src="/image/profil/profile.jpg"
                  alt="Adlan Madjied Ridho"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-black leading-tight text-white">
                  Adlan Madjied Ridho
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold">
                  {isAdminTyping ? (
                    <span className="animate-pulse text-white">
                      sedang mengetik...
                    </span>
                  ) : isAdminOnline ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      <span className="text-white">online</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-white/40" />
                      <span className="text-blue-50/80">offline</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Aksi kanan */}
            <div className="flex shrink-0 items-center gap-2">
              {user && (
                <div ref={headerMenuRef} className="relative">
                  <button
                    onClick={() => setIsMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    aria-label="Menu akun"
                    className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/20 p-1 pr-2 text-white transition duration-200 hover:scale-105 hover:bg-white/30 active:scale-95"
                  >
                    <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-950/60 text-xs font-bold">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        inisial
                      )}
                    </span>
                    <IconChevron
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-3xl border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950 p-2"
                    >
                      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-700 to-cyan-500 p-3">
                        <Dekor
                          jenis="cincin"
                          className="absolute -right-8 -top-8 h-24 w-24 text-white/20"
                        />
                        <p className="relative truncate text-sm font-bold text-white">
                          {namaTampil}
                        </p>
                        <p className="relative truncate text-[11px] text-blue-50/80">
                          {user?.email}
                        </p>
                      </div>

                      {isEditingName ? (
                        <div className="space-y-2 p-2 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                            Ubah Nama
                          </p>
                          <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateName();
                            }}
                            autoFocus
                            className="w-full rounded-xl border border-blue-400/20 bg-blue-950/60 px-3 py-2 text-xs text-white outline-none transition focus:border-cyan-300/70"
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={handleUpdateName}
                              className="flex-1 cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 py-2 text-[11px] font-bold text-white transition duration-200 hover:from-blue-500 hover:to-cyan-400 active:scale-95"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setIsEditingName(false)}
                              className="cursor-pointer rounded-xl bg-blue-500/15 px-3 py-2 text-[11px] font-semibold text-blue-200 transition hover:bg-blue-500/25 active:scale-95"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          role="menuitem"
                          onClick={() => setIsEditingName(true)}
                          className="mt-2 flex w-full cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15 active:bg-blue-500/25"
                        >
                          <IconPen />
                          Edit Nama Panggilan
                        </button>
                      )}

                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15 active:bg-blue-500/25"
                      >
                        <IconLogout />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                aria-label="Tutup chat"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition duration-200 hover:scale-110 hover:bg-white/30 active:scale-90"
              >
                <IconClose />
              </button>
            </div>
          </div>
        </header>

        {/* ===== ISI ===== */}
        {memuat ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-blue-200/70">
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
            </div>
          </div>
        ) : !user ? (
          /* ----- Belum login ----- */
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-8 text-center">
            <Dekor
              jenis="gelombang"
              className="absolute -right-10 top-4 h-56 w-56 text-cyan-300/10"
            />
            <Dekor
              jenis="titik"
              className="absolute -bottom-8 -left-6 h-40 w-40 text-blue-400/10"
            />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-400 text-white">
              <IconChat className="h-7 w-7" />
            </span>
            <h3 className="relative mt-5 text-xl font-black text-white">
              Mari ngobrol
            </h3>
            <p className="relative mt-2 max-w-xs text-sm leading-relaxed text-blue-200/80">
              Login dulu untuk mulai mengirim pesan. Cocok untuk kebutuhan
              website maupun sekadar obrolan.
            </p>
            <button
              onClick={handleMasuk}
              className="relative mt-6 flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white transition duration-200 ease-out hover:scale-105 hover:from-blue-500 hover:to-cyan-400 active:scale-95 active:from-blue-700 active:to-cyan-600"
            >
              <IconLogin />
              Login
            </button>
          </div>
        ) : (
          <>
            {/* ----- Daftar pesan (infinite scroll ke atas) ----- */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="scrollbar-biru relative flex-1 overflow-y-auto px-4 py-5 sm:px-6"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Dekor
                    jenis="gelombang"
                    className="h-32 w-32 text-cyan-300/15"
                  />
                  <p className="-mt-4 text-sm font-semibold text-blue-100">
                    Belum ada pesan
                  </p>
                  <p className="mt-1 text-xs text-blue-300/60">
                    Kirim pesan pertamamu ke Adlan.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Indikator memuat pesan lama / awal percakapan */}
                  <div className="flex h-6 items-center justify-center">
                    {loadingOlder ? (
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
                      </div>
                    ) : !hasMore ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/40">
                        Awal percakapan
                      </span>
                    ) : null}
                  </div>

                  {messages.map((msg) => {
                    const repliedMsg = getRepliedMessage(msg.reply_to_id);

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.is_admin ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`flex w-full max-w-[85%] flex-col sm:max-w-[75%] ${
                            msg.is_admin ? "items-start" : "items-end"
                          }`}
                        >
                          {editingId === msg.id ? (
                            <div className="flex w-full gap-2 rounded-2xl border border-blue-400/30 bg-blue-950/80 p-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleEditMessage(msg.id);
                                  if (e.key === "Escape") {
                                    setEditingId(null);
                                    setEditText("");
                                  }
                                }}
                                autoFocus
                                className="min-w-0 flex-1 rounded-xl border border-blue-400/20 bg-blue-950/60 px-3 py-1.5 text-xs text-white outline-none transition focus:border-cyan-300/70"
                              />
                              <button
                                onClick={() => handleEditMessage(msg.id)}
                                className="cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white transition hover:from-blue-500 hover:to-cyan-400 active:scale-95"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditText("");
                                }}
                                className="cursor-pointer rounded-xl bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/25 active:scale-95"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="relative flex max-w-full flex-col">
                              {repliedMsg && (
                                <div
                                  className={`mb-[-6px] max-w-full select-none rounded-t-2xl border-l-2 px-3 py-1.5 pb-2.5 ${
                                    msg.is_admin
                                      ? "border-cyan-300 bg-blue-500/10"
                                      : "border-white/70 bg-blue-900/60"
                                  }`}
                                >
                                  <span className="block truncate text-[9px] font-bold uppercase tracking-wider text-cyan-200">
                                    {repliedMsg.is_admin
                                      ? "Adlan (Admin)"
                                      : "Anda"}
                                  </span>
                                  <p className="mt-0.5 truncate text-[11px] text-blue-100/80">
                                    {repliedMsg.text}
                                  </p>
                                </div>
                              )}

                              {/* Klik = buka dropdown, klik dua kali = tutup dropdown */}
                              <div
                                data-bubble
                                onMouseDown={(e) => {
                                  // Cegah teks terseleksi saat klik dua kali
                                  if (e.detail > 1) e.preventDefault();
                                }}
                                onClick={() => setOpenMenuId(msg.id)}
                                onDoubleClick={() => setOpenMenuId(null)}
                                className={`cursor-pointer touch-manipulation select-text break-words px-4 py-2.5 text-sm leading-relaxed transition duration-200 hover:scale-[1.01] ${
                                  msg.is_admin
                                    ? `border border-blue-400/20 bg-blue-500/10 text-blue-50 hover:bg-blue-500/20 ${
                                        repliedMsg
                                          ? "rounded-b-2xl rounded-tr-2xl"
                                          : "rounded-2xl rounded-tl-md"
                                      }`
                                    : `bg-linear-to-br from-blue-600 to-cyan-500 text-white ${
                                        repliedMsg
                                          ? "rounded-b-2xl rounded-tl-2xl"
                                          : "rounded-2xl rounded-tr-md"
                                      }`
                                }`}
                              >
                                {msg.text}
                              </div>

                              {openMenuId === msg.id && (
                                <div
                                  ref={chatMenuRef}
                                  role="menu"
                                  className={`absolute top-full z-30 mt-1.5 w-44 space-y-1.5 overflow-hidden rounded-3xl border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950 p-2 ${
                                    msg.is_admin ? "left-0" : "right-0"
                                  }`}
                                >
                                  <ItemMenu
                                    ikon={<IconBalas className="h-5 w-5" />}
                                    onClick={() => {
                                      setReplyingTo(msg);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Balas
                                  </ItemMenu>

                                  {!msg.is_admin && (
                                    <>
                                      <ItemMenu
                                        ikon={<IconPen className="h-5 w-5" />}
                                        onClick={() => {
                                          setEditingId(msg.id);
                                          setEditText(msg.text);
                                          setOpenMenuId(null);
                                        }}
                                      >
                                        Edit
                                      </ItemMenu>
                                      <ItemMenu
                                        ikon={
                                          <IconSampah className="h-5 w-5" />
                                        }
                                        warnaIkon="text-sky-300"
                                        onClick={() => {
                                          setDeleteTargetId(msg.id);
                                          setOpenMenuId(null);
                                        }}
                                      >
                                        Hapus
                                      </ItemMenu>
                                    </>
                                  )}
                                </div>
                              )}

                              <div
                                className={`mt-1 flex select-none items-center gap-1 px-1 text-[10px] text-blue-300/60 ${
                                  msg.is_admin
                                    ? "justify-start"
                                    : "justify-end"
                                }`}
                              >
                                <span>{formatMessageTime(msg.updated_at)}</span>

                                {!msg.is_admin && (
                                  <span className="ml-0.5 inline-flex">
                                    {msg.status === "sending" ? (
                                      <IconCentang className="h-3 w-3 text-blue-400/50" />
                                    ) : (
                                      <IconCentang
                                        ganda
                                        className={`h-3.5 w-3.5 ${
                                          msg.is_read
                                            ? "text-cyan-300"
                                            : "text-blue-300/50"
                                        }`}
                                      />
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
                </div>
              )}
            </div>

            {/* ----- Form kirim ----- */}
            <form
              onSubmit={handleSendMessage}
              className="shrink-0 border-t border-blue-400/15 bg-blue-950/40 p-3 sm:p-4"
            >
              <div className="overflow-hidden rounded-2xl border border-blue-400/20 bg-blue-950/60 transition focus-within:border-cyan-300/70">
                {replyingTo && (
                  <div className="flex items-center justify-between border-b border-blue-400/15 bg-blue-500/10 px-4 py-2">
                    <div className="min-w-0 border-l-2 border-cyan-300 pl-2.5 pr-4 text-left">
                      <span className="block text-[9px] font-bold uppercase tracking-widest text-cyan-200">
                        Membalas{" "}
                        {replyingTo.is_admin ? "Adlan (Admin)" : "Diri Sendiri"}
                      </span>
                      <span className="mt-0.5 block truncate text-xs italic text-blue-100/80">
                        {replyingTo.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      aria-label="Batal membalas"
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-blue-300/70 transition hover:text-cyan-300 active:scale-90"
                    >
                      <IconClose className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 px-3 py-2">
                  <input
                    value={text}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-blue-300/40"
                    placeholder={
                      replyingTo
                        ? "Tulis balasan Anda..."
                        : "Tulis pesan ke Adlan..."
                    }
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    aria-label="Kirim pesan"
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white transition duration-200 ease-out hover:scale-105 hover:from-blue-500 hover:to-cyan-400 active:scale-90 active:from-blue-700 active:to-cyan-600 disabled:cursor-not-allowed disabled:from-blue-900/60 disabled:to-blue-900/60 disabled:text-blue-300/40 disabled:hover:scale-100"
                  >
                    <IconKirim className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {/* ===== MODAL KONFIRMASI HAPUS ===== */}
        {deleteTargetId && (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDeleteTargetId(null);
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label="Hapus pesan"
              className="relative w-full max-w-xs overflow-hidden rounded-[2rem] border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950"
            >
              <div className="relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400 px-5 py-4">
                <Dekor
                  jenis="cincin"
                  className="absolute -right-10 -top-12 h-36 w-36 text-white/20"
                />
                <h3 className="relative text-base font-black text-white">
                  Hapus Pesan?
                </h3>
              </div>
              <div className="space-y-4 p-5">
                <p className="text-xs leading-relaxed text-blue-200/80">
                  Tindakan ini tidak dapat dibatalkan. Pesan akan dihapus
                  secara permanen.
                </p>
                <div className="flex gap-2">
                  <button
                    ref={confirmButtonRef}
                    onClick={executeDeleteMessage}
                    className="flex-1 cursor-pointer rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 py-2.5 text-xs font-bold text-white outline-none transition duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300 active:scale-95"
                  >
                    Hapus (Enter)
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(null)}
                    className="flex-1 cursor-pointer rounded-2xl border border-blue-400/30 bg-blue-500/10 py-2.5 text-xs font-semibold text-blue-100 transition duration-200 hover:bg-blue-500/20 active:scale-95"
                  >
                    Batal (Esc)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}