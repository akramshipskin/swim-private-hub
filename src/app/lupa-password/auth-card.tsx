import { AuthShell } from "@/components/auth-shell";
import { Card, CardBody } from "@/components/ui/card";

// Halaman Lupa Password dan Buat Password Baru memakai kerangka halaman Masuk.
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <AuthShell points={["Tautan berlaku 30 menit dan hanya sekali pakai", "Semua perangkat yang masih masuk dikeluarkan", "Akun tanpa email: minta reset ke admin"]}>
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-1 text-xl font-semibold text-text">{title}</h1>
          <p className="mb-5 text-sm text-text-muted">{subtitle}</p>
          {children}
        </CardBody>
      </Card>
    </AuthShell>
  );
}
