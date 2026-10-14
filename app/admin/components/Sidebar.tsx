// src/components/Sidebar.tsx (atau sesuaikan dengan path folder Anda)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  name: string;
  path: string;
  iconPath: string; // atribut "d" dari SVG
}

interface SidebarProps {
  hideMobile?: boolean;
}

const menuItems: MenuItem[] = [
  {
    name: "Beranda",
    path: "/admin",
    iconPath:
      "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  },
  {
    name: "Karya Tulis",
    path: "/admin/karya-tulis",
    iconPath:
      "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  },
  {
    name: "Website",
    path: "/admin/koleksi-website",
    iconPath:
      "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
  },
  {
    name: "Chat",
    path: "/admin/chat",
    iconPath:
      "M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
  },
];

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export default function Sidebar({ hideMobile = false }: SidebarProps) {
  const pathname = usePathname();

  // "/admin" harus persis sama, menu lain aktif juga untuk sub-halamannya
  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="group fixed left-0 top-0 z-50 hidden h-screen w-16 flex-col justify-center bg-zinc-950 antialiased transition-[width] duration-150 ease-in-out hover:w-56 md:flex">
        <nav className="flex w-full flex-col gap-1.5 px-2" aria-label="Menu admin">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                title={item.name}
                className={`flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                <Icon d={item.iconPath} className="h-5 w-5 flex-shrink-0" />
                <span className="overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 2. MOBILE BOTTOM NAVBAR */}
      <nav
        aria-label="Menu admin"
        className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 antialiased md:hidden ${
          hideMobile ? "hidden" : "flex"
        }`}
      >
        <div className="mx-auto flex w-full max-w-sm items-center justify-around">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                className="flex select-none flex-col items-center gap-1 px-3 py-1"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                    active
                      ? "scale-110 bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon d={item.iconPath} className="h-5 w-5" />
                </span>
                <span
                  className={`text-[10px] font-bold tracking-wide transition-colors ${
                    active ? "text-blue-500" : "text-zinc-500"
                  }`}
                >
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