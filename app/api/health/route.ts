import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function GET() {
  try {
    // Setiap kali UptimeRobot mengakses halaman ini, kita update waktu "last_checked"
    // Karena kita menggunakan anonym/public client, pastikan RLS untuk UPDATE juga diizinkan jika diperlukan, 
    // ATAU kita lakukan update otomatis di tingkat database, tapi cara paling aman adalah:
    
    const { data, error } = await supabase
      .from("system_status")
      .update({ last_checked: new Date().toISOString() })
      .eq("id", 1)
      .select();

    if (error) throw error;

    // Kembalikan respon status 200 OK yang disukai UptimeRobot
    return NextResponse.json({ 
      success: true, 
      status: "Operational",
      message: "Sistem AMR aktif dan berjalan normal." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Health check error:", error);
    
    // Jika Supabase bermasalah, tetap beri respon gagal agar UptimeRobot tahu website sedang Down
    return NextResponse.json({ 
      success: false, 
      status: "Down",
      message: "Gagal menghubungkan ke database." 
    }, { status: 500 });
  }
}