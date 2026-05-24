"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { name: "Beranda", path: "/admin", icon: "fa-solid fa-house" },
    { name: "Karya Tulis", path: "/admin/karya-tulis", icon: "fa-solid fa-pen-to-square" },
    { name: "Website", path: "/admin/koleksi-website", icon: "fa-solid fa-globe" },
    { name: "Chat", path: "/admin/chat", icon: "fa-solid fa-comment-dots" },
  ];

  return (
    <>
      {/* 1. VERSI LAPTOP / DESKTOP (VERTICAL CENTERED & SLIM) */}
      {/* Menggunakan bg-black solid dan menghapus seluruh border pembatas halaman */}
      <aside className="group fixed left-0 top-0 h-screen w-16 hover:w-56 hidden md:flex flex-col justify-center bg-black border-none z-50 transition-[width] duration-100 ease-in-out will-change-[width]">
        
        {/* Kontainer menu menyesuaikan lebar penuh aside */}
        <div className="flex flex-col gap-2 w-full px-2">
          {menuItems.map((item) => {
            const isSelected = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center rounded-xl py-3 px-3 text-sm font-bold transition-colors duration-100 gap-4 ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                    : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100"
                }`}
              >
                {/* Ikon simetris di tengah saat ciut */}
                <i className={`${item.icon} text-base w-5 text-center flex-shrink-0 ${
                  isSelected ? "text-white" : "text-zinc-500 group-hover:text-zinc-400"
                }`} />
                
                {/* Teks menu muncul instan menyesuaikan percepatan sidebar */}
                <span className="whitespace-nowrap text-zinc-200 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* 2. VERSI HP / MOBILE */}
      {/* Diubah menjadi hitam pekat solid juga agar senada dengan versi desktop */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black px-4 py-2 border-none">
        <div className="flex justify-around items-center max-w-sm mx-auto">
          {menuItems.map((item) => {
            const isSelected = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl"
              >
                <span className={`text-sm flex items-center justify-center h-10 w-10 rounded-full transition-all duration-100 ${
                  isSelected 
                    ? "bg-emerald-600 text-white scale-110 shadow-md shadow-emerald-600/20" 
                    : "text-zinc-500 hover:text-emerald-500"
                }`}>
                  <i className={item.icon} />
                </span>
                <span className={`text-[10px] font-extrabold tracking-wide ${
                  isSelected ? "text-emerald-500" : "text-zinc-500"
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}