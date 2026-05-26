"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase"; 
import { Database } from "@/lib/database.types";
import PostFormModal from "../components/PostFormModal";
import PostView from "../components/PostView";

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

const PAGE_SIZE = 6;

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
      const raw = data as Database['public']['Tables']['posts']['Row'][];
      const normalized = raw.map(d => ({
        ...d,
        status: d.status === 'Published' || d.status === 'Draft' ? (d.status as "Published" | "Draft") : null,
      })) as Post[];

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

  const handleSubmit = async (data: Partial<Post> & { id?: string }) => {
    try {
      if (modal.mode === 'edit' && data.id) {
        await supabase.from('posts').update(data as Database['public']['Tables']['posts']['Update']).eq('id', data.id);
      } else {
        await supabase.from('posts').insert([data as Database['public']['Tables']['posts']['Insert']]);
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
    <main className="md:pl-20 px-6 min-h-screen bg-black pt-12 pb-24">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-6 py-3 rounded-md text-white font-bold text-xs ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {confirmDelete?.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-md w-full max-w-sm">
            <h3 className="text-white font-black mb-4">Hapus Permanen?</h3>
            <p className="text-zinc-400 text-xs mb-8">Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-zinc-800 py-2 rounded-md text-xs font-bold text-white">Batal</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 py-2 rounded-md text-xs font-bold text-white">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {modal.isOpen && <PostFormModal mode={modal.mode} initialData={modal.data} onClose={() => setModal({ ...modal, isOpen: false })} onSubmit={handleSubmit} />}
      {viewPost && <PostView post={viewPost} onClose={() => setViewPost(null)} />}

      <div className="w-full max-w-6xl mx-auto flex items-end justify-between mb-16">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Karya Tulis</h1>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Kelola arsip konten</p>
        </div>
        <button onClick={() => setModal({ isOpen: true, mode: 'add', data: null })} className="bg-white text-black px-8 py-3 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95">
          + Tulis Baru
        </button>
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {posts.map((post) => (
          <div key={post.id} className="group flex flex-col cursor-pointer" onClick={() => setViewPost(post)}>
            <div className="w-full aspect-[4/3] bg-zinc-900 overflow-hidden mb-4 shadow-xl">
              {post.cover_url ? <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800 font-black">NO COVER</div>}
            </div>
            <h2 className="text-sm font-bold text-zinc-200 leading-snug mb-4">{post.title}</h2>
            <div className="flex justify-end gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setModal({ isOpen: true, mode: 'edit', data: post })} className="bg-zinc-800 px-4 py-2 text-[10px] font-bold text-white uppercase hover:bg-zinc-700 transition-all rounded-md">Edit</button>
              <button onClick={() => setConfirmDelete({ isOpen: true, id: post.id, cover_url: post.cover_url ?? undefined })} className="bg-zinc-800 px-4 py-2 text-[10px] font-bold text-red-400 uppercase hover:bg-red-900/50 transition-all rounded-md">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-12">
            <button onClick={() => { setPage(p => p + 1); fetchPosts(page + 1); }} className="text-zinc-500 text-[10px] uppercase tracking-widest hover:text-white">Muat Lainnya</button>
        </div>
      )}
    </main>
  );
}