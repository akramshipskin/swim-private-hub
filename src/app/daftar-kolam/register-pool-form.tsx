"use client";

import { useState } from "react";
import { PendingApprovalScreen } from "@/components/pending-approval-screen";
import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { isValidIndonesianPhone } from "@/lib/format";

export default function RegisterPoolForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formRenderedAt] = useState(() => Date.now());
  const [website, setWebsite] = useState("");
  const [poolName, setPoolName] = useState("");
  const [address, setAddress] = useState("");
  const [openTime, setOpenTime] = useState("06:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidIndonesianPhone(phone)) {
      setError("Format No HP tidak valid (contoh: 0812xxxxxxx)");
      return;
    }
    if (closeTime <= openTime) {
      setError("Jam tutup harus setelah jam buka");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName,
        phone,
        email: email || undefined,
        password,
        poolName,
        address,
        openTime,
        closeTime,
        website,
        formRenderedAt,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registrasi gagal");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) return <PendingApprovalScreen roleLabel="pemilik kolam" />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Swim Private Hub"
          width={56}
          height={56}
          className="mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg shadow-brand-500/20"
          priority
        />
        <p className="text-lg text-text"><Logotype /></p>
        <p className="text-sm text-text-muted">Gabung jadi kolam mitra</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Daftar Kolam</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Honeypot anti-spam -- pola sama kayak /register. */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="website">Jangan isi kolom ini</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <Field label="Nama Kolam">
              <Input value={poolName} onChange={(e) => setPoolName(e.target.value)} required />
            </Field>
            <Field label="Alamat">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jam Buka">
                <Input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  required
                />
              </Field>
              <Field label="Jam Tutup">
                <Input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  required
                />
              </Field>
            </div>

            <hr className="border-border" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
              Akun pemilik (buat login)
            </p>

            <Field label="Nama Pemilik">
              <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required autoComplete="name" />
            </Field>
            <Field label="No HP">
              <Input
                type="tel"
                placeholder="0812xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </Field>
            <Field label="Email (opsional)">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>

            <label className="flex items-start gap-2 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-600 focus:ring-brand-500"
              />
              <span>
                Saya setuju dengan{" "}
                <a href="/syarat-ketentuan" target="_blank" className="font-medium text-brand-600 hover:underline">
                  Syarat &amp; Ketentuan
                </a>{" "}
                dan{" "}
                <a href="/kebijakan-privasi" target="_blank" className="font-medium text-brand-600 hover:underline">
                  Kebijakan Privasi
                </a>
                .
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} disabled={!agreed} className="mt-1 w-full">
              Daftar
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Sudah punya akun?{" "}
            <a href="/login" className="font-medium text-brand-600 hover:underline">
              Login
            </a>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
