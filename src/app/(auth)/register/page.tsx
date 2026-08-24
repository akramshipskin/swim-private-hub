"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";

type Participant = { type: "self" | "child"; name: string };

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { type: "self", name: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateParticipant(i: number, patch: Partial<Participant>) {
    setParticipants((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email: email || undefined,
        password,
        childNames: participants.filter((p) => p.type === "child").map((p) => p.name),
        wantsSelf: participants.some((p) => p.type === "self"),
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Les Renang Cianjur"
          width={56}
          height={56}
          className="mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg shadow-brand-500/20"
          priority
        />
        <p className="text-lg font-semibold text-text">Les Renang Cianjur</p>
        <p className="text-sm text-text-muted">Booking jadwal renang dengan coach favoritmu</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Daftar Member</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nama/Orang Tua">
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

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">Siapa yang mau les?</p>
              <p className="text-xs text-text-subtle">
                Bisa diri sendiri, bisa anak, bisa keduanya. Bisa ditambah lagi nanti.
              </p>
              {participants.map((p, i) => {
                // "Diri sendiri" cuma boleh dipilih di 1 baris -- 1 akun cuma
                // punya 1 "diri sendiri", pilih di baris lain bikin keliatan
                // kayak beberapa orang padahal yang ke-create cuma 1.
                const selfTakenElsewhere = participants.some(
                  (other, idx) => idx !== i && other.type === "self"
                );
                return (
                <div key={i} className="flex gap-2">
                  <Select
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
                      required
                      className="min-w-0 flex-1"
                    />
                  )}
                </div>
                );
              })}
              <button
                type="button"
                onClick={() => setParticipants((prev) => [...prev, { type: "child", name: "" }])}
                className="self-start text-sm font-medium text-brand-600 hover:underline"
              >
                + Tambah peserta lain
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="mt-1 w-full">
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
