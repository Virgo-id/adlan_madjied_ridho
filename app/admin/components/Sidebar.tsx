// src/components/Sidebar.tsx (atau sesuaikan dengan path folder Anda)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

interface SidebarProps {
  hideMobile?: boolean;
}

export default function Sidebar({ hideMobile = false }: SidebarProps) {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { name: "Beranda", path: "/admin", icon: "fa-solid fa-house" },
    { name: "Karya Tulis", path: "/admin/karya-tulis", icon: "fa-solid fa-pen-to-square" },
    { name: "Website", path: "/admin/koleksi-website", icon: "fa-solid fa-globe" },
    { name: "Chat", path: "/admin/chat", icon: "fa-solid fa-comment-dots" },
  ];

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="group fixed left-0 top-0 h-screen w-16 hover:w-56 hidden md:flex flex-col justify-center bg-zinc-950 border-r border-zinc-900 z-50 transition-[width] duration-100 ease-in-out antialiased">
        <div className="flex flex-col gap-2 w-full px-2">
          {menuItems.map((item) => {
            const isSelected = pathname === item.path || (item.path === "/admin/chat" && pathname.startsWith("/admin/chat"));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center rounded-xl py-3 px-3 text-sm font-bold transition-colors gap-4 ${
                  isSelected 
                    ? "bg-blue-600 border border-blue-500 text-white" 
                    : "text-zinc-400 hover:bg-zinc-900 border border-transparent hover:text-zinc-100"
                }`}
              >
                <i className={`${item.icon} text-base w-5 text-center flex-shrink-0`} />
                <span className="whitespace-nowrap text-zinc-200 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVBAR */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 px-4 py-2 border-t border-zinc-900 ${
        hideMobile ? "hidden" : "flex"
      } antialiased`}>
        <div className="flex justify-around items-center max-w-sm mx-auto w-full">
          {menuItems.map((item) => {
            const isSelected = pathname === item.path || (item.path === "/admin/chat" && pathname.startsWith("/admin/chat"));
            return (
              <Link key={item.path} href={item.path} className="flex flex-col items-center gap-1.5 py-1 px-3 select-none">
                <span className={`text-sm flex items-center justify-center h-10 w-10 rounded-full transition-all ${
                  isSelected 
                    ? "bg-blue-600 border border-blue-500 text-white scale-110 shadow-[0_0_15px_rgba(37,99,235,0.2)]" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}>
                  <i className={item.icon} />
                </span>
                <span className={`text-[10px] font-extrabold tracking-wide transition-colors ${
                  isSelected ? "text-blue-500" : "text-zinc-500"
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