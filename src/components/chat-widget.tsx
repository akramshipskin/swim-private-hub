"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Msg = { id: string; sender: "USER" | "AI" | "ADMIN" | "SYSTEM"; content: string; createdAt: string };

const senderLabel: Record<Msg["sender"], string> = { USER: "Kamu", AI: "Asisten", ADMIN: "Admin", SYSTEM: "Info" };

// Tombol bantuan mengambang (member, coach, pemilik kolam). Dijawab AI;
// yang gak bisa dijawab diteruskan ke tab Pesan admin, balasannya muncul di sini.
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/chat");
    if (res.ok) setMessages((await res.json()).messages);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Muat awal dipanggil saat tombol dibuka (lihat toggle); di sini polling pelan selama panel terbuka, buat balasan admin.
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [open, load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal mengirim pesan.");
      return;
    }
    setText("");
    setMessages(data.messages);
  }

  return (
    <div className="fixed right-4 bottom-20 z-40 sm:bottom-6">
      {open && (
        <div
          role="dialog"
          aria-label="Chat bantuan"
          className="mb-3 flex h-[28rem] max-h-[70vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text">Bantuan</p>
              <p className="text-xs text-text-subtle">Dijawab asisten, diteruskan ke admin bila perlu</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup chat" className="rounded-md px-2 py-1 text-text-muted hover:bg-surface-muted">
              ✕
            </button>
          </div>
          <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-text-muted">Halo! Ada yang bisa dibantu soal booking, paket, jadwal, atau saldo?</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.sender === "USER" ? "self-end text-right" : "self-start"}>
                <p className="mb-0.5 text-[11px] text-text-subtle">{senderLabel[m.sender]}</p>
                <p
                  className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-left text-sm whitespace-pre-wrap ${
                    m.sender === "USER" ? "bg-brand-600 text-white" : m.sender === "SYSTEM" ? "bg-warning-bg text-warning-text" : "bg-surface-muted text-text"
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="flex flex-col gap-1.5 border-t border-border p-3">
            <div className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">Tulis pesan</label>
              <input
                id="chat-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000}
                placeholder="Tulis pertanyaan…"
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button type="submit" size="sm" loading={sending}>Kirim</Button>
            </div>
            {error && <p className="text-xs text-danger-text">{error}</p>}
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          if (!open) load();
          setOpen(!open);
        }}
        aria-expanded={open}
        className="ml-auto flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-700"
      >
        {open ? "Tutup" : "Butuh bantuan?"}
      </button>
    </div>
  );
}
