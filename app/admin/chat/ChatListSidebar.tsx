// src/app/admin/chat/ChatListSidebar.tsx
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

type Folder = {
  id: string;
  name: string;
  password: string | null;
};

type Modal =
  | null
  | { kind: "form"; folder: Folder | null }
  | { kind: "unlock"; folder: Folder }
  | { kind: "move"; user: ChatUser };

type PesanRingkas = {
  id: string;
  sender_id: string | null;
  text: string | null;
  created_at: string;
  is_admin: boolean | null;
  is_read: boolean | null;
};

const UKURAN_HALAMAN = 1000;

// Mengambil seluruh baris per halaman, supaya tidak terpotong batas 1000 baris
async function ambilSemuaHalaman<T>(
  buat: (
    dari: number,
    sampai: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<{ data: T[]; error: string | null }> {
  const hasil: T[] = [];
  for (let dari = 0; ; dari += UKURAN_HALAMAN) {
    const { data, error } = await buat(dari, dari + UKURAN_HALAMAN - 1);
    if (error) return { data: hasil, error: error.message };
    hasil.push(...(data ?? []));
    if (!data || data.length < UKURAN_HALAMAN) break;
  }
  return { data: hasil, error: null };
}

const ICONS = {
  chevronDown: "M19.5 8.25l-7.5 7.5-7.5-7.5",
  close: "M6 18L18 6M6 6l12 12",
  search: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  folder:
    "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  folderPlus:
    "M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  lockClosed:
    "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
  lockOpen:
    "M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
  pencil:
    "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125",
} as const;

function Icon({ d, className = "w-4 h-4" }: { d: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

/* ---------------------------------------------------------------
   MODAL (overlay solid, tanpa blur supaya ringan)
---------------------------------------------------------------- */

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 md:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-xs rounded-3xl border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-sm font-bold text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function UnlockModal({
  folder,
  onClose,
  onUnlock,
}: {
  folder: Folder;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === folder.password) {
      onUnlock();
    } else {
      setWrong(true);
    }
  };

  return (
    <ModalShell title={`Buka folder "${folder.name}"`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          placeholder="Masukkan sandi"
          autoFocus
          className="w-full rounded-2xl border border-blue-400/20 bg-blue-950/60 px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-blue-300/40 focus:border-cyan-300/70"
        />
        {wrong && <p className="text-[11px] font-semibold text-sky-200">Sandi salah.</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-2xl bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-200 transition duration-200 hover:bg-blue-500/20 active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex-1 cursor-pointer rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-2.5 text-xs font-bold text-white transition duration-200 hover:from-blue-500 hover:to-cyan-400 active:scale-95"
          >
            Buka
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function FolderFormModal({
  folder,
  onClose,
  onSave,
  onDelete,
}: {
  folder: Folder | null;
  onClose: () => void;
  onSave: (name: string, password: string | null) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(folder?.name ?? "");
  const [password, setPassword] = useState(folder?.password ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), password.trim() || null);
  };

  return (
    <ModalShell title={folder ? "Ubah folder" : "Folder baru"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-blue-300">
            Nama folder
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Klien"
            autoFocus
            className="w-full rounded-2xl border border-blue-400/20 bg-blue-950/60 px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-blue-300/40 focus:border-cyan-300/70"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-blue-300">
            Sandi (opsional)
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kosongkan jika tanpa sandi"
            className="w-full rounded-2xl border border-blue-400/20 bg-blue-950/60 px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-blue-300/40 focus:border-cyan-300/70"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-2xl bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-200 transition duration-200 hover:bg-blue-500/20 active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 cursor-pointer rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-2.5 text-xs font-bold text-white transition duration-200 hover:from-blue-500 hover:to-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            Simpan
          </button>
        </div>
        {folder && (
          <button
            type="button"
            onClick={onDelete}
            className="w-full cursor-pointer rounded-2xl px-3 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-950/40"
          >
            Hapus folder
          </button>
        )}
      </form>
    </ModalShell>
  );
}

function MoveModal({
  user,
  folders,
  currentFolderId,
  onClose,
  onMove,
}: {
  user: ChatUser;
  folders: Folder[];
  currentFolderId?: string;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
}) {
  const rowClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-semibold transition-colors ${
      active ? "bg-linear-to-r from-blue-600 to-cyan-500 text-white" : "text-blue-100 hover:bg-blue-500/15"
    }`;

  return (
    <ModalShell title={`Simpan ${user.full_name || "kontak"} ke folder`} onClose={onClose}>
      <div className="scrollbar-biru max-h-64 space-y-1 overflow-y-auto">
        {folders.length === 0 && (
          <p className="py-2 text-center text-[11px] italic text-blue-300/60">
            Belum ada folder. Buat dulu lewat tombol folder di atas daftar.
          </p>
        )}
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onMove(f.id)}
            className={rowClass(currentFolderId === f.id)}
          >
            <Icon d={ICONS.folder} className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{f.name}</span>
            {f.password && <Icon d={ICONS.lockClosed} className="h-3.5 w-3.5 text-blue-300/70" />}
          </button>
        ))}
        {currentFolderId && (
          <button type="button" onClick={() => onMove(null)} className={rowClass(false)}>
            <Icon d={ICONS.close} className="h-4 w-4 flex-shrink-0" />
            Keluarkan dari folder
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full cursor-pointer rounded-2xl bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-200 transition duration-200 hover:bg-blue-500/20 active:scale-95"
      >
        Batal
      </button>
    </ModalShell>
  );
}

/* ---------------------------------------------------------------
   KOMPONEN UTAMA
---------------------------------------------------------------- */

export default function ChatListSidebar({ activeId }: { activeId?: string }) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DROPDOWN & PENCARIAN (pengguna tanpa chat) ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- REALTIME STATUS ---
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Penanda permintaan terbaru: hasil fetch lama tidak boleh menimpa yang baru
  const requestIdRef = useRef(0);

  // --- FOLDER ---
  const [folders, setFolders] = useState<Folder[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // contact_id -> folder_id
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set()); // folder yang sudah dibuka sandinya
  const [modal, setModal] = useState<Modal>(null);

  const closeModal = useCallback(() => setModal(null), []);

  const fetchChatUsers = useCallback(async (silent = false) => {
    const requestId = ++requestIdRef.current;

    try {
      if (!silent) setLoading(true);

      // 1. Semua profil user
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url");

      if (profilesError) {
        setError(profilesError.message);
        return;
      }

      // 2. Seluruh riwayat pesan (per halaman, terbaru dulu)
      const { data: messages, error: messagesError } =
        await ambilSemuaHalaman<PesanRingkas>((dari, sampai) =>
          supabase
            .from("messages")
            .select("id, sender_id, text, created_at, is_admin, is_read")
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(dari, sampai)
        );

      if (messagesError) {
        setError(messagesError);
        return;
      }

      // Ada permintaan yang lebih baru: abaikan hasil lama ini
      if (requestId !== requestIdRef.current) return;

      // 3. Unread per user
      const unreadCountsMap = new Map<string, number>();
      messages.forEach((msg) => {
        if (msg.sender_id && !msg.is_admin && !msg.is_read) {
          unreadCountsMap.set(msg.sender_id, (unreadCountsMap.get(msg.sender_id) || 0) + 1);
        }
      });

      // 4. Pesan terakhir per user (data sudah terurut terbaru dulu)
      const latestMessageMap = new Map<string, { text: string | null; created_at: string }>();
      messages.forEach((msg) => {
        if (msg.sender_id && !latestMessageMap.has(msg.sender_id)) {
          latestMessageMap.set(msg.sender_id, {
            text: msg.text,
            created_at: msg.created_at,
          });
        }
      });

      // 5. Gabungkan
      const detailedUsers: ChatUser[] = (profiles || []).map((profile: any) => {
        const latestMsg = latestMessageMap.get(profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name || "User Tanpa Nama",
          avatar_url: profile.avatar_url || null,
          last_message: latestMsg?.text || null,
          last_message_time: latestMsg?.created_at || null,
          unread_count: unreadCountsMap.get(profile.id) || 0,
        };
      });

      // 6. Urutkan: chat terbaru di atas
      detailedUsers.sort((a, b) => {
        if (a.last_message_time && b.last_message_time) {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        }
        return a.last_message_time ? -1 : b.last_message_time ? 1 : 0;
      });

      setUsers(detailedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    const [foldersRes, assignRes] = await Promise.all([
      supabase.from("chat_folders").select("id, name, password").order("created_at", { ascending: true }),
      supabase.from("chat_folder_contacts").select("contact_id, folder_id"),
    ]);

    if (foldersRes.error) {
      setError(foldersRes.error.message);
      return;
    }
    if (assignRes.error) {
      setError(assignRes.error.message);
      return;
    }

    setFolders((foldersRes.data || []) as Folder[]);

    const map: Record<string, string> = {};
    (assignRes.data || []).forEach((row: any) => {
      map[row.contact_id] = row.folder_id;
    });
    setAssignments(map);
  }, []);

  useEffect(() => {
    fetchChatUsers(false);
    fetchFolders();
  }, [fetchChatUsers, fetchFolders]);

  // --- REALTIME (MESSAGES + PRESENCE + TYPING) ---
  useEffect(() => {
    const typingTimeouts = typingTimeoutsRef.current;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    // Banyak event beruntun (mis. tandai terbaca) cukup memicu satu fetch
    const jadwalkanRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void fetchChatUsers(true);
      }, 300);
    };

    const channel = supabase.channel("sidebar-global-realtime", {
      config: {
        presence: { key: "admin-sidebar" },
      },
    });

    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, jadwalkanRefresh)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeOnlineMap: Record<string, boolean> = {};

        Object.keys(state).forEach((key) => {
          if (key !== "admin-sidebar") {
            activeOnlineMap[key] = true;
          }
        });
        setOnlineUsers(activeOnlineMap);
      })
      .on("broadcast", { event: "typing_global" }, (payload) => {
        const { userId, isTyping } = payload.payload;
        if (!userId) return;

        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));

        if (isTyping) {
          if (typingTimeouts[userId]) clearTimeout(typingTimeouts[userId]);

          typingTimeouts[userId] = setTimeout(() => {
            setTypingUsers((prev) => ({ ...prev, [userId]: false }));
          }, 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ active_at: new Date().toISOString() });
          // Sinkron ulang: pesan yang masuk saat koneksi sempat putus ikut terambil
          jadwalkanRefresh();
        }
      });

    // Saat tab kembali aktif, tarik ulang data (event bisa terlewat di background)
    const saatTabAktif = () => {
      if (document.visibilityState === "visible") jadwalkanRefresh();
    };
    document.addEventListener("visibilitychange", saatTabAktif);

    return () => {
      document.removeEventListener("visibilitychange", saatTabAktif);
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
      Object.values(typingTimeouts).forEach(clearTimeout);
    };
  }, [fetchChatUsers]);

  // --- AKSI FOLDER ---
  const saveFolder = async (folder: Folder | null, name: string, password: string | null) => {
    const payload = { name, password };
    const { error: err } = folder
      ? await supabase.from("chat_folders").update(payload).eq("id", folder.id)
      : await supabase.from("chat_folders").insert(payload);

    if (err) {
      setError(err.message);
      return;
    }
    setModal(null);
    await fetchFolders();
  };

  const deleteFolder = async (folder: Folder) => {
    if (!confirm(`Hapus folder "${folder.name}"? Kontak di dalamnya kembali ke daftar utama.`)) return;

    const { error: err } = await supabase.from("chat_folders").delete().eq("id", folder.id);
    if (err) {
      setError(err.message);
      return;
    }
    setModal(null);
    await fetchFolders();
  };

  const moveContact = async (contactId: string, folderId: string | null) => {
    const { error: err } = folderId
      ? await supabase
          .from("chat_folder_contacts")
          .upsert({ contact_id: contactId, folder_id: folderId }, { onConflict: "contact_id" })
      : await supabase.from("chat_folder_contacts").delete().eq("contact_id", contactId);

    if (err) {
      setError(err.message);
      return;
    }
    setModal(null);
    await fetchFolders();
  };

  const isFolderLocked = (folder: Folder) => !!folder.password && !unlocked.has(folder.id);

  const handleFolderClick = (folder: Folder) => {
    if (isFolderLocked(folder)) {
      setModal({ kind: "unlock", folder });
      return;
    }
    setOpenFolders((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }));
  };

  const relockFolder = (folderId: string) => {
    setUnlocked((prev) => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
    setOpenFolders((prev) => ({ ...prev, [folderId]: false }));
  };

  // --- PEMISAHAN DATA ---
  const usersInFolder = (folderId: string) => users.filter((u) => assignments[u.id] === folderId);
  const usersWithChat = users.filter((u) => u.last_message_time !== null && !assignments[u.id]);
  const usersNoChat = users.filter((u) => u.last_message_time === null && !assignments[u.id]);

  const filteredUsersNoChat = usersNoChat.filter((user) =>
    (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render satu item user
  const renderUserItem = (user: ChatUser) => {
    const isActive = activeId === user.id;
    const nameInitial = (user.full_name || "U").charAt(0);
    const isUserOnline = onlineUsers[user.id] || false;
    const isUserTyping = typingUsers[user.id] || false;

    return (
      <div
        key={user.id}
        className={`group flex items-center rounded-2xl transition-colors ${
          isActive
            ? "bg-linear-to-r from-blue-600/40 to-cyan-500/20 ring-1 ring-cyan-300/30"
            : "hover:bg-blue-500/10"
        }`}
      >
        <Link
          href={`/admin/chat/${user.id}`}
          className="flex min-w-0 flex-1 select-none items-center gap-3 px-2 py-2"
        >
          <div className="relative flex-shrink-0">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.full_name || "User"}
                className="h-9 w-9 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-400 text-xs font-bold uppercase text-white">
                {nameInitial}
              </div>
            )}

            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#040a16] transition-colors duration-300 ${
                isUserOnline ? "bg-emerald-500" : "bg-blue-900"
              }`}
            ></span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-baseline justify-between gap-1.5">
              <p
                className={`truncate text-xs transition-colors ${
                  isActive
                    ? "font-extrabold text-white"
                    : "font-semibold text-blue-100 group-hover:text-white"
                }`}
              >
                {user.full_name || "User"}
              </p>

              {user.last_message_time && !isUserTyping && (
                <span
                  className={`flex-shrink-0 select-none font-mono text-[9px] transition-colors ${
                    isActive ? "font-bold text-cyan-300" : "text-blue-300/60 group-hover:text-blue-200"
                  }`}
                >
                  {new Date(user.last_message_time).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            <div className="mt-0.5 flex items-center justify-between gap-2">
              <p
                className={`truncate text-[11px] transition-colors ${
                  isUserTyping
                    ? "animate-pulse font-medium text-cyan-300"
                    : isActive
                    ? "text-blue-100"
                    : "text-blue-300/70 group-hover:text-blue-200"
                }`}
              >
                {isUserTyping ? "sedang mengetik..." : user.last_message || "Tidak ada pesan"}
              </p>

              {user.unread_count > 0 && (
                <div className="flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-cyan-400 px-1 font-mono text-[9px] font-bold text-white">
                  {user.unread_count}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Simpan kontak ke folder (di desktop muncul saat hover) */}
        <button
          type="button"
          onClick={() => setModal({ kind: "move", user })}
          title="Simpan ke folder"
          aria-label="Simpan ke folder"
          className="mr-1 flex-shrink-0 rounded-lg p-1.5 text-blue-300/60 transition hover:bg-blue-500/15 hover:text-cyan-200 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          <Icon d={ICONS.folder} className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Render satu folder
  const renderFolder = (folder: Folder) => {
    const locked = isFolderLocked(folder);
    const isOpen = !!openFolders[folder.id] && !locked;
    const members = usersInFolder(folder.id);
    const unreadTotal = members.reduce((sum, u) => sum + u.unread_count, 0);

    return (
      <div key={folder.id}>
        <div className="group flex items-center rounded-2xl transition-colors hover:bg-blue-500/10">
          <button
            type="button"
            onClick={() => handleFolderClick(folder)}
            className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-cyan-300">
              <Icon d={locked ? ICONS.lockClosed : ICONS.folder} className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-blue-100 group-hover:text-white">
                {folder.name}
              </span>
              <span className="block text-[11px] text-blue-300/60">{members.length} kontak</span>
            </span>
            {unreadTotal > 0 && (
              <span className="flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-cyan-400 px-1 font-mono text-[9px] font-bold text-white">
                {unreadTotal}
              </span>
            )}
            {!locked && (
              <Icon
                d={ICONS.chevronDown}
                className={`h-4 w-4 flex-shrink-0 text-blue-300/60 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Kunci lagi (hanya jika folder bersandi dan sedang terbuka) */}
          {folder.password && !locked && (
            <button
              type="button"
              onClick={() => relockFolder(folder.id)}
              title="Kunci folder"
              aria-label="Kunci folder"
              className="flex-shrink-0 rounded-lg p-1.5 text-blue-300/60 transition hover:bg-blue-500/15 hover:text-cyan-200"
            >
              <Icon d={ICONS.lockOpen} className="h-4 w-4" />
            </button>
          )}

          {/* Ubah folder (tidak tersedia selama masih terkunci) */}
          {!locked && (
            <button
              type="button"
              onClick={() => setModal({ kind: "form", folder })}
              title="Ubah folder"
              aria-label="Ubah folder"
              className="mr-1 flex-shrink-0 rounded-lg p-1.5 text-blue-300/60 transition hover:bg-blue-500/15 hover:text-cyan-200"
            >
              <Icon d={ICONS.pencil} className="h-4 w-4" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {members.length > 0 ? (
              members.map((user) => renderUserItem(user))
            ) : (
              <p className="px-2 py-2 text-[11px] italic text-blue-300/60">Folder masih kosong.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="scrollbar-biru flex h-full w-full flex-col justify-between overflow-y-auto p-4 pb-24 text-blue-100 antialiased md:pb-4">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-sm font-bold uppercase tracking-widest text-blue-200">Daftar Obrolan</h1>
          <button
            type="button"
            onClick={() => setModal({ kind: "form", folder: null })}
            title="Folder baru"
            aria-label="Folder baru"
            className="cursor-pointer rounded-full p-2 text-blue-300/80 transition duration-200 hover:bg-blue-500/15 hover:text-cyan-200 active:scale-90"
          >
            <Icon d={ICONS.folderPlus} className="h-4 w-4" />
          </button>
        </div>

        {loading && users.length === 0 && (
          <div className="animate-pulse py-8 text-center text-xs font-medium uppercase tracking-widest text-blue-300/60">
            Sinkronisasi...
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start justify-between gap-2 rounded-2xl bg-blue-500/10 p-3 text-xs font-semibold text-sky-200">
            <span className="min-w-0 break-words">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Tutup pesan error"
              className="flex-shrink-0 text-sky-200/70 hover:text-sky-100"
            >
              <Icon d={ICONS.close} className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* FOLDER */}
        {folders.length > 0 && <div className="mb-4 space-y-1">{folders.map((f) => renderFolder(f))}</div>}

        {/* LIST 1: USER YANG SUDAH PUNYA CHAT (di luar folder) */}
        <div className="mb-8 space-y-1">
          {usersWithChat.length > 0
            ? usersWithChat.map((user) => renderUserItem(user))
            : !loading && (
                <div className="py-4 text-center text-xs text-blue-300/60">Belum ada obrolan aktif.</div>
              )}
        </div>
      </div>

      {/* LIST 2: USER TANPA CHAT (DROPDOWN) */}
      {usersNoChat.length > 0 && (
        <div className="mt-auto pt-4">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-xs font-semibold text-blue-300/80 transition-colors hover:text-cyan-200"
          >
            <span>Hubungi Pengguna Baru ({usersNoChat.length})</span>
            <Icon
              d={ICONS.chevronDown}
              className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="mt-2 space-y-3">
              <div className="relative">
                <Icon
                  d={ICONS.search}
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-300/60"
                />
                <input
                  type="text"
                  placeholder="Cari nama user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-blue-400/20 bg-blue-950/60 py-2.5 pl-9 pr-8 text-xs text-white outline-none transition placeholder:text-blue-300/40 focus:border-cyan-300/70"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-200/80"
                  >
                    <Icon d={ICONS.close} className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="scrollbar-biru max-h-48 space-y-1 overflow-y-auto pr-1">
                {filteredUsersNoChat.length > 0 ? (
                  filteredUsersNoChat.map((user) => renderUserItem(user))
                ) : (
                  <div className="py-2 text-center text-[11px] italic text-blue-300/60">
                    User tidak ditemukan
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {modal?.kind === "unlock" && (
        <UnlockModal
          folder={modal.folder}
          onClose={closeModal}
          onUnlock={() => {
            const id = modal.folder.id;
            setUnlocked((prev) => new Set(prev).add(id));
            setOpenFolders((prev) => ({ ...prev, [id]: true }));
            setModal(null);
          }}
        />
      )}

      {modal?.kind === "form" && (
        <FolderFormModal
          folder={modal.folder}
          onClose={closeModal}
          onSave={(name, password) => saveFolder(modal.folder, name, password)}
          onDelete={() => modal.folder && deleteFolder(modal.folder)}
        />
      )}

      {modal?.kind === "move" && (
        <MoveModal
          user={modal.user}
          folders={folders}
          currentFolderId={assignments[modal.user.id]}
          onClose={closeModal}
          onMove={(folderId) => moveContact(modal.user.id, folderId)}
        />
      )}
    </div>
  );
}