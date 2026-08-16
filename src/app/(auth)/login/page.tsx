"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export default function LoginPage() {
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
      setError("Email/No HP atau password salah");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-6 text-center">
        <p className="text-lg font-semibold text-text">Les Renang Cianjur</p>
        <p className="text-sm text-text-muted">Booking jadwal renang dengan coach favoritmu</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Masuk ke akunmu</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Email atau No HP">
              <Input
                type="text"
                placeholder="nama@email.com atau 0812xxxxxxx"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
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
            <a href="/register" className="font-medium text-brand-600 hover:underline">
              Daftar
            </a>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
