import { Post } from "../karya-tulis/page";

export default function PostView({ post, onClose }: { post: Post, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto p-6 md:p-12 custom-scrollbar">
      
      {/* Tombol Tutup di pojok kanan atas yang beku */}
      <div className="sticky top-0 right-0 w-full flex justify-end mb-8 z-10">
        <button 
          onClick={onClose} 
          className="bg-zinc-900/80 backdrop-blur-md px-6 py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-zinc-800 transition-all border border-zinc-800"
        >
          Tutup
        </button>
      </div>

      <article className="max-w-3xl mx-auto pb-20">
        {post.cover_url && (
          <img 
            src={post.cover_url} 
            className="w-full h-80 object-cover mb-8" // Menghapus class grayscale di sini
            alt={post.title}
          />
        )}
        
        <h1 className="text-4xl font-black text-white mb-4 leading-tight">{post.title}</h1>
        
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-900/30 px-3 py-1 bg-emerald-900/10">
            {post.category}
          </span>
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            {post.status}
          </span>
        </div>

        <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans text-lg">
          {post.content}
        </div>
      </article>
    </div>
  );
}