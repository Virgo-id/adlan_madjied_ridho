"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase"; 
import PostFormModal from "../components/PostFormModal";
import PostView from "../components/PostView";

export interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: "Published" | "Draft";
  views: number;
  content: string;
  cover_url: string;
}

const PAGE_SIZE = 6;

export default function KaryaTulisDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [modal, setModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data?: Post | null }>({ 
    isOpen: false, 
    mode: 'add' 
  });
  const [viewPost, setViewPost] = useState<Post | null>(null);

  const fetchPosts = useCallback(async (isNew = false) => {
    const from = isNew ? 0 : page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (data) {
      setPosts(prev => isNew ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      if (!isNew) setPage(p => p + 1);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const handleSubmit = async (data: any) => {
    if (modal.mode === 'edit' && data.id) {
      await supabase.from('posts').update(data).eq('id', data.id);
    } else {
      await supabase.from('posts').insert([data]);
    }
    fetchPosts(true);
    setPage(1); 
    setModal({ isOpen: false, mode: 'add', data: null });
  };

  const handleDelete = async (id: string) => {
    // Tanpa confirm browser, langsung eksekusi
    await supabase.from('posts').delete().eq('id', id);
    fetchPosts(true);
    setPage(1);
  };

  return (
    <main className="md:pl-20 px-6 min-h-screen bg-black pt-12 pb-24">
      {modal.isOpen && (
        <PostFormModal 
          mode={modal.mode} 
          initialData={modal.data}
          onClose={() => setModal({ ...modal, isOpen: false })} 
          onSubmit={handleSubmit}
        />
      )}

      {viewPost && <PostView post={viewPost} onClose={() => setViewPost(null)} />}

      <div className="w-full max-w-6xl mx-auto flex items-end justify-between mb-16">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Karya Tulis</h1>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">
            Kelola arsip konten
          </p>
        </div>
        <button 
          onClick={() => setModal({ isOpen: true, mode: 'add', data: null })}
          className="bg-white text-black px-8 py-3 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95"
        >
          + Tulis Baru
        </button>
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {posts.map((post) => (
          <div key={post.id} className="group flex flex-col cursor-pointer" onClick={() => setViewPost(post)}>
            {/* Sampul: Kotak tajam */}
            <div className="w-full aspect-[4/3] bg-zinc-900 overflow-hidden mb-4 shadow-xl">
              {post.cover_url ? (
                <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-800 font-black">NO COVER</div>
              )}
            </div>
            
            <h2 className="text-sm font-bold text-zinc-200 leading-snug mb-4">{post.title}</h2>
            
            {/* Action Bar: Abu kehitaman, Rata kanan, Sedikit lengkung */}
            <div className="flex justify-end gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setModal({ isOpen: true, mode: 'edit', data: post })} 
                className="bg-zinc-800 px-4 py-2 text-[10px] font-bold text-white uppercase hover:bg-zinc-700 transition-all rounded-md"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(post.id)} 
                className="bg-zinc-800 px-4 py-2 text-[10px] font-bold text-red-400 uppercase hover:bg-red-900/50 transition-all rounded-md"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="w-full text-center mt-20">
          <button 
            onClick={() => fetchPosts()}
            className="text-zinc-500 hover:text-white text-[10px] font-bold tracking-widest uppercase transition-all border border-zinc-900 px-8 py-3 hover:border-zinc-700 rounded-md"
          >
            Muat Lebih Banyak
          </button>
        </div>
      )}
    </main>
  );
}