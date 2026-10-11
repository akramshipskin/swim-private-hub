"use client";

import { useState, useSyncExternalStore } from "react";
import { rejectRegistration } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { buildRejectionWaLink } from "@/lib/whatsapp";

// Tolak pendaftar coach/pemilik kolam dengan alasan (Hadi 10 Okt); setelah
// ditolak, admin ditawari kabar lewat WhatsApp dengan teks siap pakai.
const waKey = (userId: string) => `reject-wa-${userId}`;
const WA_CLASS =
  "rounded-md px-2 py-1.5 text-sm font-medium text-whatsapp-text hover:bg-whatsapp/10 max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center";

// Tautan kabar penolakan di kartu "Ditolak" (nomor pendaftar sudah dihapus di
// server, jadi tautan hanya ada di peramban admin yang menolak). Hilang begitu diklik.
export function RejectionWaLink({ userId }: { userId: string }) {
  const [used, setUsed] = useState(false);
  const link = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return sessionStorage.getItem(waKey(userId));
      } catch {
        return null;
      }
    },
    () => null,
  );
  if (!link || used) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        try {
          sessionStorage.removeItem(waKey(userId));
        } catch {}
        setTimeout(() => setUsed(true), 0);
      }}
      className={WA_CLASS}
    >
      Kabari Penolakan Lewat WhatsApp
    </a>
  );
}

export default function RejectRegistrationButton({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wa, setWa] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await rejectRegistration(userId, reason);
    setLoading(false);
    if ("error" in res) return setError(res.error);
    setOpen(false);
    const link = res.phone ? buildRejectionWaLink(res.phone, res.name, res.role, reason.trim().replace(/\.?$/, ".")) : "";
    // Halaman memuat ulang sesudah penolakan dan kartu ini diganti kartu
    // "Ditolak"; tautan dititipkan ke sessionStorage supaya RejectionWaLink
    // di kartu baru bisa menampilkannya sekali.
    try {
      if (link) sessionStorage.setItem(waKey(userId), link);
    } catch {}
    setWa(link);
  }

  if (wa !== null) {
    return wa ? (
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          try {
            sessionStorage.removeItem(waKey(userId));
          } catch {}
        }}
        className={WA_CLASS}
      >
        Kabari Penolakan Lewat WhatsApp (tautan hanya muncul sekali)
      </a>
    ) : (
      <span className="text-sm text-text-muted">Ditolak</span>
    );
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Tolak
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface-muted p-3">
      <label htmlFor={`reject-${userId}`} className="text-sm font-medium text-text">
        Alasan menolak {userName}
      </label>
      <Textarea
        id={`reject-${userId}`}
        rows={3}
        maxLength={300}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Contoh: sertifikat belum dilampirkan"
      />
      <p className="text-xs text-text-subtle">Alasan ikut dikirim ke pendaftar lewat WhatsApp. Pendaftar boleh daftar ulang dengan nomor yang sama.</p>
      {error && <p role="alert" className="text-sm text-danger-text">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" variant="danger" loading={loading} onClick={submit}>
          Ya, Tolak
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
          Batal
        </Button>
      </div>
    </div>
  );
}
