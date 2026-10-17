"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Post } from "../page";

interface ModalProps {
  mode: 'add' | 'edit';
  onClose: () => void;
  onSubmit: (data: Partial<Post> & { id?: string }) => void;
  initialData?: Post | null;
}

const CATEGORIES = ["Esai", "Cerpen", "Puisi", "Resensi"];

const KELAS_INPUT =
  "w-full rounded-2xl border border-blue-400/20 bg-blue-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-blue-300/40 focus:border-cyan-300/70 disabled:opacity-60";

const KELAS_LABEL =
  "block pl-1 text-[10px] font-bold uppercase tracking-widest text-blue-300";

export default function PostFormModal({ mode, onClose, onSubmit, initialData }: ModalProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "Esai",
    status: initialData?.status || "Draft",
    content: initialData?.content || "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Tutup dengan Escape + kunci scroll halaman saat modal terbuka
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", tekan);
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tekan);
      document.body.style.overflow = overflowLama;
    };
  }, [onClose]);

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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Tinggi dibatasi dan isi di-scroll sendiri untuk menjaga performa rendering */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'add' ? 'Tulis karya baru' : 'Edit karya tulis'}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-blue-400/30 bg-linear-to-br from-blue-950 to-zinc-950"
      >
        {/* Kepala */}
        <div className="relative shrink-0 overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400 px-6 py-5">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 text-white/20"
          >
            <circle cx="100" cy="100" r="30" />
            <circle cx="100" cy="100" r="60" />
            <circle cx="100" cy="100" r="90" />
          </svg>
          <h2 className="relative text-xl font-black text-white">
            {mode === 'add' ? 'Tulis Karya Baru' : 'Edit Karya Tulis'}
          </h2>
          <p className="relative mt-0.5 text-xs text-blue-50/90">
            {mode === 'add' ? 'Isi detail karya lalu simpan.' : 'Ubah detail karya lalu simpan.'}
          </p>
        </div>

        {/* Isi */}
        <div className="scrollbar-biru flex-1 space-y-5 overflow-y-auto p-6">
          <div className="space-y-1.5">
            <label htmlFor="pf-title" className={KELAS_LABEL}>Judul</label>
            <input
              id="pf-title"
              name="title"
              onChange={handleChange}
              value={formData.title}
              className={KELAS_INPUT}
              placeholder="Judul tulisan..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="pf-category" className={KELAS_LABEL}>Kategori</label>
              <select
                id="pf-category"
                name="category"
                onChange={handleChange}
                value={formData.category}
                className={`${KELAS_INPUT} cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white`}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pf-status" className={KELAS_LABEL}>Status</label>
              <select
                id="pf-status"
                name="status"
                onChange={handleChange}
                value={formData.status}
                className={`${KELAS_INPUT} cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white`}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pf-cover" className={KELAS_LABEL}>Gambar Sampul</label>
            <input
              id="pf-cover"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full cursor-pointer rounded-2xl border border-blue-400/20 bg-blue-950/60 p-2 text-xs text-blue-200 outline-none transition file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-linear-to-r file:from-blue-600 file:to-cyan-500 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:border-cyan-300/70"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pf-content" className={KELAS_LABEL}>Konten</label>
            <textarea
              id="pf-content"
              name="content"
              onChange={handleChange}
              value={formData.content}
              className={`${KELAS_INPUT} h-48 resize-y`}
              placeholder="Tulis konten artikel di sini..."
            />
          </div>
        </div>

        {/* Kaki */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-blue-400/15 px-6 py-4">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full bg-blue-500/10 px-5 py-2.5 text-xs font-semibold text-blue-200 transition duration-200 hover:bg-blue-500/20 active:scale-95"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="cursor-pointer rounded-full bg-linear-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white transition duration-200 hover:from-blue-500 hover:to-cyan-400 active:scale-95 disabled:cursor-wait disabled:opacity-60 disabled:active:scale-100"
          >
            {loading ? "Memproses..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}