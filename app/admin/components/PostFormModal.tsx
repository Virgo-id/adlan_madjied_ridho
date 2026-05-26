"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Post } from "../karya-tulis/page";

interface ModalProps {
  mode: 'add' | 'edit';
  onClose: () => void;
  onSubmit: (data: Partial<Post> & { id?: string }) => void;
  initialData?: Post | null;
}

const CATEGORIES = ["Esai", "Cerpen", "Puisi", "Resensi"];

export default function PostFormModal({ mode, onClose, onSubmit, initialData }: ModalProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "Esai",
    status: initialData?.status || "Draft",
    content: initialData?.content || "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    let cover_url = initialData?.cover_url || "";

    try {
      if (imageFile) {
        // Dynamic Import agar library berat tidak membebani initial load
        const imageCompression = (await import('browser-image-compression')).default;
        
        const options = { 
            maxSizeMB: 0.3, // Turunkan sedikit agar lebih ringan
            maxWidthOrHeight: 800, // Ukuran dikurangi untuk performa UI
            useWebWorker: true 
        };
        
        const compressedFile = await imageCompression(imageFile, options);

        const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
        const { error } = await supabase.storage
          .from('sampul')
          .upload(fileName, compressedFile);

        if (!error) {
          const { data: publicUrlData } = supabase.storage.from('sampul').getPublicUrl(fileName);
          cover_url = publicUrlData.publicUrl;
        }
      }

      const dataToSubmit = { 
        ...formData, 
        cover_url,
        ...(initialData?.id && { id: initialData.id }) 
      };

      onSubmit(dataToSubmit);
    } catch (err) {
      console.error("Gagal memproses gambar:", err);
      alert("Terjadi kesalahan saat memproses gambar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      {/* Menggunakan fixed height dan overflow untuk menjaga performa rendering */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="mb-6 border-b border-zinc-900 pb-4">
          <h2 className="text-white font-black text-xl uppercase tracking-widest">
            {mode === 'add' ? 'Tulis Karya Baru' : 'Edit Karya Tulis'}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
          <input 
            name="title" 
            onChange={handleChange} 
            value={formData.title} 
            className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 text-sm outline-none focus:border-zinc-500 transition-all" 
            placeholder="JUDUL TULISAN..." 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select name="category" onChange={handleChange} value={formData.category} className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 text-xs font-bold uppercase outline-none">
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select name="status" onChange={handleChange} value={formData.status} className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 text-xs font-bold uppercase outline-none">
              <option value="Draft">DRAFT</option>
              <option value="Published">PUBLISHED</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Gambar Sampul</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2 file:bg-zinc-800 file:border-none file:text-white file:px-3 file:py-1 file:rounded-sm cursor-pointer text-[10px]" 
            />
          </div>

          <textarea 
            name="content" 
            onChange={handleChange} 
            value={formData.content} 
            className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 h-48 text-sm outline-none focus:border-zinc-500 transition-all" 
            placeholder="Tulis konten artikel di sini..." 
          />
        </div>

        <div className="flex gap-4 justify-end mt-6 pt-4 border-t border-zinc-900">
          <button onClick={onClose} className="text-zinc-500 font-bold px-4 py-2 text-[10px] uppercase tracking-widest hover:text-white">Batal</button>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="bg-white text-black px-6 py-2 font-black uppercase text-[10px] rounded-sm hover:bg-emerald-500 hover:text-white disabled:opacity-50"
          >
            {loading ? "MEMPROSES..." : "SIMPAN"}
          </button>
        </div>
      </div>
    </div>
  );
}