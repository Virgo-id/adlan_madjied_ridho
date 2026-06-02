"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const email = `${username}@adlanmadjiedridho.com`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage("Kredensial salah. Silakan coba lagi.");
      } else {
        window.location.href = "/admin"; 
      }
    } catch (err) {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Tombol Kembali ke Beranda */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 text-xs font-medium transition-colors group bg-zinc-950/40 backdrop-blur-md border border-zinc-900/80 px-3 py-2 rounded-xl"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform"
          >
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Kembali ke Beranda
        </Link>
      </div>

      {/* Efek Ambient Glow Latar Belakang - UBAH KE BIRU */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none select-none" />

      {/* FORM CARD */}
      <div className="w-full max-w-sm bg-zinc-950/60 backdrop-blur-xl p-8 rounded-2xl border border-zinc-900/80 shadow-2xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Form - UBAH KE BIRU */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-400">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">Admin Area</h1>
          <p className="text-zinc-500 text-xs mt-1">Silakan masuk untuk mengelola dashboard chat.</p>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5 text-left">
          {/* Input Username - UBAH KE BIRU */}
          <div className="space-y-1.5">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block pl-1">Username</label>
            <div className="relative">
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800/80 rounded-xl py-3 px-4 text-white text-xs outline-none focus:border-blue-600/80 focus:bg-black transition-all placeholder-zinc-700"
                placeholder="Masukkan username"
                required
                disabled={loading}
                autoFocus
                suppressHydrationWarning // JALUR PINTAS INPUT 1
              />
            </div>
          </div>

          {/* Input Password - UBAH KE BIRU */}
          <div className="space-y-1.5">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block pl-1">Password</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800/80 rounded-xl py-3 px-4 text-white text-xs outline-none focus:border-blue-600/80 focus:bg-black transition-all placeholder-zinc-700"
                placeholder="••••••••"
                required
                disabled={loading}
                suppressHydrationWarning // JALUR PINTAS INPUT 2
              />
            </div>
          </div>

          {/* Submit Button - UBAH KE BIRU */}
          <button 
            disabled={loading}
            suppressHydrationWarning // JALUR PINTAS BUTTON
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-950/40"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Memverifikasi...</span>
              </>
            ) : (
              "Masuk ke Dashboard"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}