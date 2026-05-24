"use client";

import { useState } from "react";

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  online: boolean;
}

interface Message {
  id: string;
  sender: "me" | "user";
  text: string;
  time: string;
}

export default function ChatDashboard() {
  const [contacts] = useState<Contact[]>([
    { id: "1", name: "Zainal Abidin", lastMessage: "Ji, sistem login SIAKAD kemarin aman kan?", time: "10.15", unread: true, online: true },
    { id: "2", name: "Rahmat Hidayat", lastMessage: "Buku katalog Perpustakaan Lubangsa sudah di-update?", time: "Kemarin", unread: false, online: false },
    { id: "3", name: "Faris Ahmad", lastMessage: "Minta tolong cek error token API-nya dong.", time: "23 Mei", unread: false, online: true },
  ]);

  const [activeContact, setActiveContact] = useState<Contact | null>(contacts[0]);
  const [inputMessage, setInputMessage] = useState("");
  
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "user", text: "Halo Adlan, mau tanya soal aplikasi OPAC.", time: "10.00" },
    { id: "2", sender: "me", text: "Yo, halo! Kenapa bro? Ada bagian yang eror atau mau request fitur?", time: "10.02" },
    { id: "3", sender: "user", text: "Ji, sistem login SIAKAD kemarin aman kan?", time: "10.15" },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: inputMessage,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, newMsg]);
    setInputMessage("");
  };

  return (
    <main className="flex-1 md:pl-20 px-4 md:px-6 h-screen flex flex-col items-start justify-start pt-4 pb-4 md:pt-6 md:pb-6 bg-black transition-all duration-300 ease-out overflow-hidden">
      
      {/* RUANG DISKUSI INTERAKTIF */}
      <div className="w-full flex flex-1 overflow-hidden gap-0 md:gap-6 relative">
        
        {/* KOLOM KIRI: DAFTAR KONTAK PESAN */}
        <div className={`flex flex-col w-full md:w-72 flex-shrink-0 border-r-0 md:border-r border-zinc-900 md:pr-4 space-y-4 overflow-y-auto transition-all duration-200 ${
          activeContact ? "hidden md:flex" : "flex"
        }`}>
          <div className="select-none px-1">
            <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest">
              Pesan Masuk
            </p>
          </div>
          
          <div className="space-y-1">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 ${
                  activeContact?.id === contact.id
                    ? "bg-zinc-900 text-white"
                    : "hover:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-200">
                    {contact.name}
                    {contact.online && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-semibold">{contact.time}</span>
                </div>
                <p className={`text-[11px] truncate ${activeContact?.id === contact.id ? "text-zinc-400" : "text-zinc-500"}`}>
                  {contact.lastMessage}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* KOLOM KANAN: CHAT BUBBLE STREAM & RUANG KETIK */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-200 ${
          activeContact ? "flex" : "hidden md:flex"
        }`}>
          
          {activeContact ? (
            <>
              {/* Header Room Chat */}
              <div className="pb-3 border-b border-zinc-900 flex items-center gap-3 flex-shrink-0">
                <button 
                  onClick={() => setActiveContact(null)}
                  className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 active:scale-95 transition-all"
                >
                  <i className="fa-solid fa-arrow-left text-xs" />
                </button>

                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-white leading-tight">
                    {activeContact.name}
                  </h2>
                  <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider mt-0.5">
                    {activeContact.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Area Aliran Pesan Obrolan */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
                {messages.map((msg) => {
                  const isMe = msg.sender === "me";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <div className={`rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed ${
                        isMe
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-900 text-zinc-300"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] font-medium text-zinc-600 mt-1 px-1">
                        {msg.time}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Tempat Ketik / Input Baris Pesan */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-zinc-900 flex items-center gap-2 flex-shrink-0 pb-2 md:pb-0">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ketik balasan pesan..."
                  className="flex-1 bg-zinc-900 text-zinc-200 text-xs font-semibold px-4 py-3 rounded-xl border-0 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  className="h-9 w-9 flex items-center justify-center bg-white text-black rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                >
                  <i className="fa-solid fa-paper-plane text-xs" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 select-none">
              <i className="fa-regular fa-comments text-2xl mb-2" />
              <p className="text-xs font-semibold">Pilih pesan untuk mulai mengobrol</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}