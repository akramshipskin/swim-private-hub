import Image from "next/image";
import Link from "next/link";
import { Logotype } from "@/components/ui/logotype";
import { Card, CardBody } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { buildAdminWaLink } from "@/lib/whatsapp";

// Coach & pemilik kolam yang daftar sendiri akunnya nonaktif sampai admin
// review (lihat /api/register-coach & /api/register-pool). Sebelumnya
// form langsung nyoba login -> gagal (akun nonaktif) -> dilempar ke /login
// tanpa pesan apa-apa, dan pas dicoba login muncul "password salah". Orang
// ngira pendaftarannya rusak.
export function PendingApprovalScreen({ roleLabel }: { roleLabel: string }) {
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
      </div>
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-xl font-semibold text-text">Pendaftaran diterima</h1>
          <p className="text-sm text-text-muted">
            Akun {roleLabel} kamu lagi direview admin. Kamu baru bisa login setelah akunnya
            diaktifkan admin. Mau dipercepat? Kabari admin lewat tombol di bawah.
          </p>
          <a
            href={buildAdminWaLink(`Halo admin, saya baru daftar sebagai ${roleLabel} di Swim Private Hub. Mohon dicek ya.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ className: "w-full" })}
          >
            Kabari Admin via WhatsApp
          </a>
          <Link href="/" className="text-sm font-medium text-brand-700 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
            Kembali ke Beranda
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
