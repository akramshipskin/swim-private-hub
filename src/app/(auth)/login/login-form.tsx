"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { buildAdminWaLink } from "@/lib/whatsapp";
import { formatCountdown, isLockedCode, lockSecondsFromCode } from "@/lib/login-lock";

// Kode dari src/auth.ts (LockedError dll). Selain itu = salah HP/password
// atau akun belum aktif -- sengaja tidak dibedakan.
export function loginErrorMessage(code: string | undefined): string {
  if (isLockedCode(code)) return "Terlalu banyak percobaan salah. Tunggu 15 menit, lalu coba lagi.";
  if (code === "otp_invalid") return "Kode 2FA salah atau sudah dipakai. Tunggu kode berikutnya di aplikasi.";
  return "Nomor HP/email atau password salah. Bila kamu coach atau pemilik kolam yang baru daftar, akunmu mungkin belum diaktifkan admin.";
}

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  // Diisi setelah server membalas "otp_required" (akun peran apa pun yang
  // memasang 2FA: wajib untuk admin, opsional untuk yang lain).
  const [otp, setOtp] = useState("");
  const [needsOtp, setNeedsOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Waktu (ms) kunci terbuka lagi, dari sisa detik yang dikirim server.
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const remaining = lockedUntil === null ? 0 : Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const locked = remaining > 0;

  useEffect(() => {
    if (lockedUntil === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) setLockedUntil(null);
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      otp,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.code === "otp_required") {
        setNeedsOtp(true);
        return;
      }
      const lockSeconds = lockSecondsFromCode(result.code);
      if (lockSeconds !== null) {
        setNow(Date.now());
        setLockedUntil(Date.now() + lockSeconds * 1000);
      }
      setError(loginErrorMessage(result.code));
      return;
    }

    // Login di sini lewat fetch + pindah halaman client-side, jadi browser
    // tidak pernah melihat "form submit" biasa dan tidak menawarkan simpan
    // password. Credential Management API memberi tahu browser secara
    // eksplisit (Chrome/Edge; browser lain mengabaikannya).
    type PasswordCredentialCtor = new (data: { id: string; password: string }) => Credential;
    const w = window as unknown as { PasswordCredential?: PasswordCredentialCtor };
    if (w.PasswordCredential && navigator.credentials) {
      try {
        await navigator.credentials.store(new w.PasswordCredential({ id: identifier, password }));
      } catch {
        // Browser menolak menyimpan -- bukan alasan untuk menggagalkan login.
      }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell tagline="Les renang privat dengan coach pilihan, di kolam mitra Swim Private Hub." points={["Pilih coach, kolam, dan jamnya sendiri", "Perkembangan tercatat setiap sesi", "Pembayaran jelas, diproses lewat Midtrans"]}>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Masuk ke akunmu</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nomor HP atau Email">
              <Input
                type="text"
                name="username"
                id="login-username"
                placeholder="0812xxxxxxx atau email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                name="password"
                id="login-password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>

            {needsOtp && (
              <Field label="Kode 2FA (Google Authenticator)">
                <Input
                  name="otp"
                  id="login-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={7}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                />
              </Field>
            )}

            {locked ? (
              <div role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                <p>Terlalu banyak percobaan salah. Akun ini dikunci sementara.</p>
                <p className="mt-1 font-semibold">
                  Coba lagi dalam <span className="tabular-nums">{formatCountdown(remaining)}</span>
                </p>
              </div>
            ) : (
              error && (
                <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                  {error}
                </p>
              )
            )}

            <Button type="submit" loading={loading} disabled={locked} className="mt-1 w-full">
              {locked ? `Tunggu ${formatCountdown(remaining)}` : "Masuk"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-text-muted">
            Lupa password?{" "}
            <a
              href={buildAdminWaLink("Halo Admin Swim Private Hub, saya lupa password akun saya. Nomor HP akun saya: ")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block -my-3 py-3 font-medium text-brand-700 hover:underline"
            >
              Minta reset ke admin
            </a>
          </p>
          <p className="mt-2 text-center text-sm text-text-muted">
            Belum punya akun?{" "}
            <a
              href="/register"
              className="inline-block -my-3 py-3 font-medium text-brand-700 hover:underline"
            >
              Daftar
            </a>
          </p>
        </CardBody>
      </Card>
    </AuthShell>
  );
}
