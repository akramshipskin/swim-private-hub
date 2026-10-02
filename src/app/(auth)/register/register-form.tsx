"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { isValidIndonesianPhone } from "@/lib/format";

type Participant = { type: "self" | "child"; name: string; birthDate: string };

export default function RegisterForm({ initialReferralCode = "" }: { initialReferralCode?: string }) {
  const router = useRouter();
  const [formRenderedAt] = useState(() => Date.now());
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { type: "self", name: "", birthDate: "" },
  ]);
  const [agreed, setAgreed] = useState(false);
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateParticipant(i: number, patch: Partial<Participant>) {
    setParticipants((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidIndonesianPhone(phone)) {
      setError("Format No HP tidak valid (contoh: 0812xxxxxxx)");
      return;
    }

    setLoading(true);

    let entryReferrer: string | null = null;
    try {
      entryReferrer = sessionStorage.getItem("entryReferrer") || null;
    } catch {
      // sessionStorage bisa gak available (private mode dll) -- gak fatal,
      // registrasi tetep lanjut tanpa data sumber.
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email: email || undefined,
        password,
        acceptedTerms: agreed,
        children: participants.filter((p) => p.type === "child").map((p) => ({ name: p.name, birthDate: p.birthDate })),
        wantsSelf: participants.some((p) => p.type === "self"),
        selfBirthDate: participants.find((p) => p.type === "self")?.birthDate,
        entryReferrer,
        referralCode: referralCode.trim() || undefined,
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

    const signInResult = await signIn("credentials", {
      identifier: phone,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/member/paket");
  }

  return (
    <AuthShell tagline="Daftar gratis, lalu pilih coach dan kolamnya." points={["Satu akun untuk kamu dan beberapa anak", "Harga tampil rinci sebelum bayar", "Mulai dari 1 sesi coba"]}>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Daftar Member</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Honeypot anti-spam: field ini disembunyiin dari user asli lewat
                CSS, tapi tetep keliatan di HTML buat bot yang isi semua field
                secara membabi buta. Jangan pake `hidden`/display:none murni --
                sebagian bot ngecek itu; off-screen positioning lebih efektif. */}
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

            <Field label="Nama orang tua / pemilik akun">
              <Input
                type="text"
                placeholder="Nama kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
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
              <Input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
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

            <Field label="Kode afiliasi coach/kolam (opsional)">
              <Input
                placeholder="Misal: NADIA27"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={20}
                autoCapitalize="characters"
              />
            </Field>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">Siapa yang mau les?</p>
              <p className="text-xs text-text-subtle">
                Bisa diri sendiri, bisa anak, bisa keduanya. Tanggal lahir wajib diisi untuk menentukan level belajar. Bisa ditambah lagi nanti.
              </p>
              {participants.map((p, i) => {
                // "Diri sendiri" cuma boleh dipilih di 1 baris -- 1 akun cuma
                // punya 1 "diri sendiri", pilih di baris lain bikin keliatan
                // kayak beberapa orang padahal yang ke-create cuma 1.
                const selfTakenElsewhere = participants.some(
                  (other, idx) => idx !== i && other.type === "self"
                );
                return (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-2">
                <div className="flex gap-2">
                  <Select
                    aria-label={`Peserta ${i + 1}: siapa`}
                    value={p.type}
                    onChange={(e) =>
                      updateParticipant(i, { type: e.target.value as Participant["type"] })
                    }
                    className="w-32 shrink-0"
                  >
                    {!selfTakenElsewhere && <option value="self">Diri sendiri</option>}
                    <option value="child">Anak</option>
                  </Select>
                  {p.type === "self" ? (
                    <p className="flex min-h-[44px] min-w-0 flex-1 items-center truncate rounded-xl border border-border bg-surface-muted px-3 text-sm text-text-muted">
                      {name || "(isi nama lengkap dulu)"}
                    </p>
                  ) : (
                    <Input
                      value={p.name}
                      onChange={(e) => updateParticipant(i, { name: e.target.value })}
                      placeholder="Nama anak"
                      aria-label={`Peserta ${i + 1}: nama anak`}
                      required
                      className="min-w-0 flex-1"
                    />
                  )}
                </div>
                <Input
                  type="date"
                  value={p.birthDate}
                  onChange={(e) => updateParticipant(i, { birthDate: e.target.value })}
                  max={new Date().toISOString().slice(0, 10)}
                  aria-label={`Peserta ${i + 1}: tanggal lahir`}
                  required
                />
                </div>
                );
              })}
              <button
                type="button"
                onClick={() => setParticipants((prev) => [...prev, { type: "child", name: "", birthDate: "" }])}
                className="self-start text-sm font-medium text-brand-700 hover:underline max-lg:min-h-[44px]"
              >
                + Tambah peserta lain
              </button>
            </div>

            <label className="flex items-start gap-2 text-xs text-text-muted max-lg:min-h-[44px] max-sm:py-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-700 focus:ring-brand-500 max-sm:h-5 max-sm:w-5"
              />
              <span>
                Saya setuju dengan{" "}
                <a href="/syarat-ketentuan" target="_blank" className="font-medium text-brand-700 hover:underline">
                  Syarat &amp; Ketentuan
                </a>{" "}
                dan{" "}
                <a href="/kebijakan-privasi" target="_blank" className="font-medium text-brand-700 hover:underline">
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
            <a href="/login" className="font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
              Masuk
            </a>
          </p>
        </CardBody>
      </Card>
    </AuthShell>
  );
}
