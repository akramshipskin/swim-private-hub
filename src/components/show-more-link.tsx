import Link from "next/link";

// "Tampilkan Lebih Banyak" untuk daftar server component (halaman coach):
// tautan memperbesar parameter ?n; hitungan menunjukkan berapa yang sudah tampil.
export function ShowMoreLink({ href, shown, total, unit }: { href: string; shown: number; total: number; unit: string }) {
  if (total <= shown) return null;
  return (
    <div className="mt-4">
      <p className="text-center text-xs text-text-subtle">
        {shown} dari {total} {unit}
      </p>
      <Link href={href} scroll={false} className="mt-2 flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-surface text-sm font-medium text-text hover:bg-surface-muted">
        Tampilkan Lebih Banyak
      </Link>
    </div>
  );
}

// Bangun tautan dengan parameter q/n/f yang dipertahankan.
export function listHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "?";
}

export function pageSize(raw: string | undefined, step: number) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= step && n <= 10_000 ? n : step;
}
