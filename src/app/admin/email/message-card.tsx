"use client";

import { useState } from "react";
import { loadEmailMessageBody } from "./actions";
import EmailBody from "./email-body";
import { senderInitial } from "@/lib/email-view";

type Body = { text: string; srcDoc: string | null };

// Satu pesan dalam percakapan. Hanya pesan terbaru yang terbuka sejak awal;
// pesan lama dilipat (seperti Gmail) dan isinya baru diambil saat dibuka,
// jadi percakapan dengan puluhan pesan tidak membuat puluhan bingkai email
// dimuat sekaligus.
export default function MessageCard({
  id,
  inbound,
  name,
  email,
  to,
  iso,
  timeLabel,
  snippet,
  initialBody,
}: {
  id: string;
  inbound: boolean;
  name: string;
  email: string;
  to: string;
  iso: string;
  timeLabel: string;
  snippet: string;
  initialBody: Body | null;
}) {
  const [open, setOpen] = useState(initialBody !== null);
  const [body, setBody] = useState<Body | null>(initialBody);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function load() {
    if (body || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await loadEmailMessageBody(id);
      if ("error" in res) setError(true);
      else setBody(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    setOpen(!open);
    if (!open) void load();
  }

  return (
    <article className={`rounded-xl border border-border ${inbound ? "bg-surface" : "bg-brand-50/40"}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-xl px-4 pb-3 pt-3 text-left max-lg:min-h-[44px]"
      >
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
          {senderInitial(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-text">
            <span className="font-semibold">{name}</span> <span className="text-xs text-text-subtle">&lt;{email}&gt;</span>
          </span>
          <span className="block truncate text-xs text-text-subtle">{open ? `kepada ${to}` : snippet}</span>
        </span>
        <time dateTime={iso} className="shrink-0 text-xs text-text-subtle">
          {timeLabel}
        </time>
      </button>
      {open && (
        <div className="px-2 pb-3 sm:px-4 sm:pb-4">
          {loading && <p className="px-2 text-sm text-text-muted">Memuat isi pesan…</p>}
          {error && (
            <p className="px-2 text-sm text-danger-text">
              Isi pesan gagal dimuat.{" "}
              <button type="button" onClick={() => void load()} className="font-medium underline">
                Coba Lagi
              </button>
            </p>
          )}
          {body &&
            (body.srcDoc ? <EmailBody srcDoc={body.srcDoc} /> : <p className="whitespace-pre-wrap text-sm text-text">{body.text}</p>)}
        </div>
      )}
    </article>
  );
}
