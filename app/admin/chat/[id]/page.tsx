// src/app/admin/chat/[id]/page.tsx
"use client";

import { use } from "react";
import ChatRoomContent from "./ChatRoomContent";

export default function JointChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    // Lepaskan grid dan sidebar dari sini. 
    // File ini sekarang murni hanya memanggil isi chat room yang akan mengisi kolom kanan {children} pada layout.tsx
    <div className="w-full h-full overflow-hidden">
      <ChatRoomContent chatUserId={id} />
    </div>
  );
}