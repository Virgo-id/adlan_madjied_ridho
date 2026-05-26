"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface WebsiteProject {
  id: string;
  name: string;
  description: string;
  url: string;
  techStack: string[];
  status: "Production" | "Development";
}

export default function KoleksiWebsiteDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<WebsiteProject[]>([
    {
      id: "1",
      name: "SIAKAD - Sistem Informasi Akademik",
      description: "Platform pengelolaan data akademik, nilai, dan penjadwalan terintegrasi.",
      url: "https://siakad.domain.com",
      techStack: ["Next.js", "Tailwind CSS", "TypeScript"],
      status: "Production",
    },
    {
      id: "2",
      name: "OPAC Perpustakaan Lubangsa",
      description: "Katalog perpustakaan digital terbuka untuk pencarian buku dan manajemen sirkulasi mandiri.",
      url: "https://opac.lubangsa.org",
      techStack: ["Next.js", "Kotlin API", "Tailwind"],
      status: "Development",
    },
  ]);

  // Proteksi Halaman: Cek Login
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/loginadmin");
      }
    };
    checkUser();
  }, [router]);

  return (
    // pl-16 ditambahkan agar konten tidak tertutup sidebar fixed Anda
    <main className="md:pl-16 px-4 md:px-6 min-h-screen flex flex-col items-start justify-start pt-8 md:pt-12 pb-24 bg-black transition-all duration-300">
      
      {/* JUDUL HALAMAN UTAMA & ACTION BUTTON */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 md:mb-12 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Koleksi Website
          </h1>
          <p className="text-[11px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider mt-0.5 leading-relaxed">
            Kelola portofolio aplikasi web dan sistem digital hasil kembanganmu
          </p>
        </div>
        
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black shadow transition-all hover:bg-emerald-500 hover:text-white w-full sm:w-auto flex-shrink-0">
          <i className="fa-solid fa-plus text-xs" />
          <span>Tambah Link</span>
        </button>
      </div>

      {/* DAFTAR WEBSITE */}
      <div className="w-full max-w-5xl space-y-8 px-1">
        <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest mb-4">
          Project Aplikasi Aktif ({projects.length})
        </p>

        {projects.map((project) => (
          <div 
            key={project.id} 
            className="group relative flex flex-col md:flex-row md:items-start justify-between pb-6 border-b border-zinc-900 last:border-0 gap-4 md:gap-0"
          >
            <div className="flex-1 md:pr-6 w-full">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h2 className="text-sm md:text-base font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors duration-200">
                  {project.name}
                </h2>
                
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                  project.status === "Production" 
                    ? "bg-emerald-950 text-emerald-400" 
                    : "bg-amber-950 text-amber-400"
                }`}>
                  <span className={`h-1 w-1 rounded-full ${project.status === "Production" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {project.status}
                </span>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl balance">
                {project.description}
              </p>

              <div className="block mt-2">
                <a 
                  href={project.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-emerald-400 transition-colors duration-200 max-w-full truncate"
                >
                  <i className="fa-solid fa-link text-[10px] flex-shrink-0" />
                  <span className="underline underline-offset-2 truncate">{project.url}</span>
                </a>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {project.techStack.map((tech) => (
                  <span 
                    key={tech} 
                    className="text-[10px] font-bold px-2 py-0.5 bg-zinc-900 rounded-md text-zinc-400 border border-zinc-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
              <button className="h-9 w-9 md:h-8 md:w-8 flex items-center justify-center rounded-lg text-xs font-bold text-zinc-500 hover:bg-zinc-900 transition-all">
                <i className="fa-solid fa-pen text-xs" />
              </button>
              <button className="h-9 w-9 md:h-8 md:w-8 flex items-center justify-center rounded-lg text-xs font-bold text-red-500 hover:bg-red-950/30 transition-all">
                <i className="fa-solid fa-trash-can text-xs" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}