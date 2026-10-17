"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import PostFormModal from "./components/PostFormModal";
import PostView from "./components/PostView";

export interface Post {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  status: "Published" | "Draft" | null;
  views: number | null;
  content: string | null;
  cover_url: string | null;
}

// Bentuk data mentah dari tabel `posts` (status masih string bebas dari database)
type PostRow = Omit<Post, "status"> & { status: string | null };

const PAGE_SIZE = 6;

// Warna bingkai kartu, sama seperti kartu karya tulis di beranda
const WARNA_KARTU = [
  "from-blue-600 to-cyan-400",
  "from-sky-500 to-blue-700",
  "from-cyan-500 to-blue-600",
  "from-blue-800 to-sky-500",
];

function IconPen({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function KaryaTulisDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [modal, setModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data?: Post | null }>({ isOpen: false, mode: 'add' });
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; cover_url?: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewPost, setViewPost] = useState<Post | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Array dependensi kosong [] agar fungsi stabil dan tidak memicu re-render useEffect
  const fetchPosts = useCallback(async (pageNum: number, isReset = false) => {
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      showToast("Gagal memuat data", "error");
      return;
    }

    if (data) {
      const raw = data as PostRow[];
      const normalized: Post[] = raw.map(d => ({
        ...d,
        status: d.status === 'Published' || d.status === 'Draft' ? d.status : null,
      }));

      setPosts(prev => isReset ? normalized : [...prev, ...normalized]);
      setHasMore(normalized.length === PAGE_SIZE);
    }
  }, []); // <-- Dependencies kosong

  // 2. useEffect hanya memanggil fungsi sekali saat mount
  useEffect(() => {
    // Memanggil fetchPosts saat mount; aman karena fetchPosts melakukan operasi async
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tutup dialog hapus dengan Escape
  useEffect(() => {
    if (!confirmDelete?.isOpen) return;
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmDelete(null);
    };
    document.addEventListener("keydown", tekan);
    return () => document.removeEventListener("keydown", tekan);
  }, [confirmDelete?.isOpen]);

  const handleSubmit = async (data: Partial<Post> & { id?: string }) => {
    try {
      if (modal.mode === 'edit' && data.id) {
        await supabase.from('posts').update(data).eq('id', data.id);
      } else {
        await supabase.from('posts').insert([data]);
      }
      showToast(`Berhasil ${modal.mode === 'add' ? 'menambahkan' : 'mengubah'} karya tulis!`);

      setPage(0);
      setModal({ isOpen: false, mode: 'add', data: null });
      fetchPosts(0, true);
    } catch (err: unknown) {
      console.error(err);
      showToast("Gagal menyimpan data", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      if (confirmDelete.cover_url) {
        const urlParts = confirmDelete.cover_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) await supabase.storage.from('sampul').remove([fileName]);
      }

      await supabase.from('posts').delete().eq('id', confirmDelete.id);
      showToast("Karya tulis berhasil dihapus.");

      setConfirmDelete(null);
      setPage(0);
      fetchPosts(0, true);
    } catch (err: unknown) {
      console.error(err);
      showToast("Gagal menghapus data", "error");
    }
  };

  return (
    // Tanpa background & tanpa offset sidebar: keduanya sudah ditangani layout admin
    <main className="min-h-screen px-5 pb-28 pt-12 font-sans text-zinc-50 antialiased md:pb-24">
      {toast && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-[100] rounded-2xl px-6 py-3 text-xs font-bold text-white ${
            toast.type === 'success'
              ? 'bg-linear-to-r from-blue-600 to-cyan-500'
              : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {confirmDelete?.isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Konfirmasi hapus"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950 p-6"
          >
            <h3 className="mb-2 text-lg font-black text-white">Hapus Permanen?</h3>
            <p className="mb-6 text-xs text-blue-200/80">Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 cursor-pointer rounded-2xl bg-blue-500/10 py-2.5 text-xs font-semibold text-blue-200 transition duration-200 hover:bg-blue-500/20 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 cursor-pointer rounded-2xl bg-red-600 py-2.5 text-xs font-bold text-white transition duration-200 hover:bg-red-500 active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.isOpen && <PostFormModal mode={modal.mode} initialData={modal.data} onClose={() => setModal({ ...modal, isOpen: false })} onSubmit={handleSubmit} />}
      {viewPost && <PostView post={viewPost} onClose={() => setViewPost(null)} />}

      <div className="mx-auto mb-12 flex w-full max-w-6xl items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-400 text-white">
            <IconPen className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
              Karya Tulis
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-blue-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Kelola arsip konten
            </p>
          </div>
        </div>
        <button
          onClick={() => setModal({ isOpen: true, mode: 'add', data: null })}
          className="shrink-0 cursor-pointer rounded-full bg-linear-to-r from-blue-600 to-cyan-500 px-6 py-3 text-xs font-bold text-white transition duration-200 ease-out hover:scale-105 hover:from-blue-500 hover:to-cyan-400 active:scale-95 active:from-blue-700 active:to-cyan-600"
        >
          + Tulis Baru
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <article
            key={post.id}
            className={`group relative flex flex-col rounded-[1.75rem] bg-linear-to-br ${WARNA_KARTU[i % WARNA_KARTU.length]} p-1.5 transition duration-300 hover:-translate-y-1.5`}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.4rem] bg-blue-950/60">
              {post.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_url}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/30">
                  <IconPen className="h-12 w-12" />
                </div>
              )}
              {post.status && (
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ${
                    post.status === 'Published'
                      ? 'bg-blue-950/80 text-cyan-200'
                      : 'bg-white/80 text-blue-900'
                  }`}
                >
                  {post.status}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 px-3.5 pt-3.5">
              {post.category && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100/90">
                  {post.category}
                </span>
              )}
              {/* Seluruh kartu bisa diklik lewat pseudo-element tombol judul (tanpa tombol bersarang) */}
              <h2 className="line-clamp-2 text-base font-extrabold leading-snug text-white">
                <button
                  type="button"
                  onClick={() => setViewPost(post)}
                  className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-[1.75rem] after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-cyan-200"
                >
                  {post.title}
                </button>
              </h2>
            </div>

            <div className="relative z-10 mt-auto flex justify-end gap-2 px-3.5 pb-3.5 pt-4">
              <button
                onClick={() => setModal({ isOpen: true, mode: 'edit', data: post })}
                className="cursor-pointer rounded-full bg-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition duration-200 hover:bg-white/30 active:scale-95"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete({ isOpen: true, id: post.id, cover_url: post.cover_url ?? undefined })}
                className="cursor-pointer rounded-full bg-blue-950/70 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-300 transition duration-200 hover:bg-red-950/80 active:scale-95"
              >
                Hapus
              </button>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={() => { setPage(p => p + 1); fetchPosts(page + 1); }}
            className="cursor-pointer rounded-full border border-blue-400/30 bg-blue-950/40 px-6 py-2.5 text-xs font-semibold text-blue-200 transition duration-200 hover:border-cyan-300/60 hover:text-cyan-200 active:scale-95"
          >
            Muat Lainnya
          </button>
        </div>
      )}
    </main>
  );
}