import type { Prisma } from "@/generated/prisma/client";
import { activePackageWhere } from "@/lib/active-package";
import { DROP_IN_MARKUP_PERCENT } from "@/lib/policy";

// Harga beli 1 sesi di sebuah kolam: harga per sesi paling mahal dari
// katalog aktif kolam itu, ditambah markup, dibulatin ke atas ke ribuan.
// null = kolam itu belum punya katalog, gak bisa jual 1 sesi.
export function dropInPrice(templates: { price: number; totalSesi: number }[]): number | null {
  const perSession = templates
    .filter((t) => t.totalSesi > 0)
    .map((t) => t.price / t.totalSesi);
  if (perSession.length === 0) return null;
  const withMarkup = (Math.max(...perSession) * (100 + DROP_IN_MARKUP_PERCENT)) / 100;
  return Math.ceil(withMarkup / 1000) * 1000;
}

// Syarat beli 1 sesi: masih punya paket BIASA yang aktif (ada sisa sesi,
// belum kedaluwarsa). Paket 1 sesi sendiri gak ngitung -- kalau ngitung,
// beli 1 sesi sekali bisa dipake buat beli 1 sesi terus tanpa paket.
export function dropInEligibilityWhere(memberId: string): Prisma.PackageWhereInput {
  return { ...activePackageWhere(memberId), isSingleSession: false };
}
