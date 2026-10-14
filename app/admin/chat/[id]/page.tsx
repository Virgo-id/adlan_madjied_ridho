// src/app/admin/chat/[id]/page.tsx
"use client";

import { use } from "react";
import ChatRoomContent from "./ChatRoomContent";

export default function JointChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="w-full h-full overflow-hidden">
      {/* key={id}: setiap pindah obrolan, ruang chat dibuat ulang dari kondisi bersih
          sehingga langsung tampil di pesan paling bawah */}
      <ChatRoomContent key={id} chatUserId={id} />
    </div>
  );
}