"use client";

import { useState } from "react";
import { PendingApprovalScreen } from "@/components/pending-approval-screen";
import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { isValidIndonesianPhone } from "@/lib/format";
import { COACH_SPECIALTIES } from "@/lib/coach-specialties";

export default function RegisterCoachForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formRenderedAt] = useState(() => Date.now());
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [hasCertification, setHasCertification] = useState(false);
  const [certificationNote, setCertificationNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleSpecialty(s: string) {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidIndonesianPhone(phone)) {
      setError("Format No HP tidak valid (contoh: 0812xxxxxxx)");
      return;
    }
    if (specialties.length === 0) {
      setError("Pilih minimal 1 keahlian");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email: email || undefined,
        password,
        acceptedTerms: agreed,
        bio,
        specialties,
        hasCertification,
        certificationNote,
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

  if (submitted) return <PendingApprovalScreen roleLabel="coach" />;

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
        <p className="text-sm text-text-muted">Mengajar renang di beberapa kolam mitra</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Daftar Coach</h1>

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

            <Field label="Nama Lengkap">
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
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
            <Field label="Bio singkat (opsional)">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Pengalaman mengajar, pendekatan mengajar, dll."
              />
            </Field>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">Keahlian (pilih minimal 1)</p>
              <div className="flex flex-wrap gap-2">
                {COACH_SPECIALTIES.map((s) => {
                  const active = specialties.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleSpecialty(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium max-sm:min-h-[44px] transition-colors ${
                        active
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-border bg-surface text-text-muted"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-text max-sm:min-h-[44px] max-sm:py-1">
              <input
                type="checkbox"
                checked={hasCertification}
                onChange={(e) => setHasCertification(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-600 focus:ring-brand-500 max-sm:h-5 max-sm:w-5"
              />
              <span>
                Saya punya sertifikasi renang/lifeguard resmi
                <span className="block text-xs text-text-muted">
                  File sertifikat diupload di menu Profil setelah akun disetujui admin. Badge &quot;Bersertifikat&quot; tampil
                  setelah sertifikat diperiksa.
                </span>
              </span>
            </label>
            {hasCertification && (
              <Field label="Nama sertifikat/lembaga">
                <Input
                  value={certificationNote}
                  onChange={(e) => setCertificationNote(e.target.value)}
                  placeholder="Misal: Sertifikasi Pelatih Renang FASI"
                />
              </Field>
            )}

            <label className="flex items-start gap-2 text-xs text-text-muted max-sm:min-h-[44px] max-sm:py-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-600 focus:ring-brand-500 max-sm:h-5 max-sm:w-5"
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
            <a href="/login" className="font-medium text-brand-600 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
              Login
            </a>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
