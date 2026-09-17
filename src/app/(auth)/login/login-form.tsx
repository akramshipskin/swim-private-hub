"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("No HP/Email atau password salah -- atau akunmu (coach/pemilik kolam yang baru daftar) belum diaktifkan admin.");
      return;
    }

    router.push("/");
    router.refresh();
  }

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
        <p className="text-sm text-text-muted">Booking jadwal renang dengan coach favoritmu</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Masuk ke akunmu</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="No HP atau Email">
              <Input
                type="text"
                placeholder="0812xxxxxxx atau email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>

            {error && (
              <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="mt-1 w-full">
              Login
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Belum punya akun?{" "}
            <a
              href="/register"
              className="inline-block -my-3 py-3 font-medium text-brand-600 hover:underline"
            >
              Daftar
            </a>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
