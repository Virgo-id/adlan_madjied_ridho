"use client";

import { supabase } from "@/lib/supabase";

export default function CustomerLogin() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/customer/chat`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-white font-black text-2xl mb-2">Support Lubangsa</h1>
        <p className="text-zinc-500 text-xs mb-8">Masuk untuk memulai diskusi dengan admin.</p>
        <button 
          onClick={handleGoogleLogin}
          className="bg-white text-black px-8 py-3 rounded-md text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
        >
          Login dengan Google
        </button>
      </div>
    </div>
  );
}