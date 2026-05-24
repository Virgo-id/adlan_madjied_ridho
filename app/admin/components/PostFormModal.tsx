"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from 'browser-image-compression';
import { Post } from "../karya-tulis/page";

interface ModalProps {
  mode: 'add' | 'edit';
  onClose: () => void;
  onSubmit: (data: any) => void;
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

    if (imageFile) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(imageFile, options);

      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error } = await supabase.storage
        .from('sampul')
        .upload(fileName, compressedFile);

      if (!error) {
        const { data: publicUrlData } = supabase.storage.from('sampul').getPublicUrl(fileName);
        cover_url = publicUrlData.publicUrl;
      }
    }

    // Menggabungkan data form dengan ID (jika mode edit) dan cover_url
    const dataToSubmit = { 
      ...formData, 
      cover_url,
      ...(initialData?.id && { id: initialData.id }) 
    };

    onSubmit(dataToSubmit);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-800 p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
        
        <div className="mb-8 border-b border-zinc-900 pb-6">
          <h2 className="text-white font-black text-2xl uppercase tracking-widest">
            {mode === 'add' ? 'Tulis Karya Baru' : 'Edit Karya Tulis'}
          </h2>
        </div>
        
        <div className="space-y-6">
          <input 
            name="title" 
            onChange={handleChange} 
            value={formData.title} 
            className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 outline-none focus:border-zinc-500 transition-all" 
            placeholder="JUDUL TULISAN..." 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select 
              name="category" 
              onChange={handleChange} 
              value={formData.category} 
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 outline-none focus:border-zinc-500 transition-all uppercase text-xs font-bold"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select 
              name="status" 
              onChange={handleChange} 
              value={formData.status} 
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 outline-none focus:border-zinc-500 transition-all uppercase text-xs font-bold"
            >
              <option value="Draft">DRAFT</option>
              <option value="Published">PUBLISHED</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Gambar Sampul</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 file:bg-zinc-800 file:border-none file:text-white file:px-4 file:py-2 file:rounded-md cursor-pointer text-xs" 
            />
          </div>

          <textarea 
            name="content" 
            onChange={handleChange} 
            value={formData.content} 
            className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 h-56 outline-none focus:border-zinc-500 transition-all" 
            placeholder="Tulis konten artikel di sini..." 
          />
        </div>

        <div className="flex gap-4 justify-end mt-10 pt-6 border-t border-zinc-900">
          <button 
            onClick={onClose} 
            className="text-zinc-500 font-bold px-6 py-3 hover:text-white transition-all text-[10px] uppercase tracking-widest rounded-md hover:bg-zinc-900"
          >
            Batal
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="bg-white text-black px-8 py-3 font-black hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest rounded-md"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}