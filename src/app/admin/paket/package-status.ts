// Label status paket di layar admin. Status di database bisa tetap "ACTIVE"
// padahal sesinya habis atau tanggalnya lewat (tidak ada pekerjaan otomatis yang
// membalik status), jadi tampilan memakai aturan yang sama dengan
// isUsablePackage (src/lib/active-package.ts): "Aktif" hanya bila benar-benar bisa dipakai.
export type PackageStatusKey = "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";

export function packageStatusLabel(
  p: { status: PackageStatusKey; sisaSesi: number; expiredDate: Date | null },
  now: Date = new Date(),
): { label: string; tone: "warning" | "success" | "neutral" } {
  if (p.status === "PENDING_PAYMENT") return { label: "Menunggu Pembayaran", tone: "warning" };
  if (p.status === "EXPIRED") return { label: "Berakhir", tone: "neutral" };
  if (p.expiredDate && p.expiredDate < now) return { label: "Berakhir", tone: "neutral" };
  if (p.sisaSesi <= 0) return { label: "Sesi habis", tone: "neutral" };
  return { label: "Aktif", tone: "success" };
}
