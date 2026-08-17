"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email: email || undefined, password }),
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
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-500/20">
          LRC
        </div>
        <p className="text-lg font-semibold text-text">Les Renang Cianjur</p>
        <p className="text-sm text-text-muted">Booking jadwal renang dengan coach favoritmu</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Daftar Member</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nama lengkap">
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
