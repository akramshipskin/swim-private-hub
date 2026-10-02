// Rekap PPh final 0,5% per mitra per bulan (WIB), bahan bukti potong yang
// dijanjikan di Perjanjian Coach & MOU Kolam (paling lambat tanggal 20 bulan
// berikutnya). Sumber: buku besar. PPh = baris PPH_WITHHELD (potong negatif,
// pembalikan positif) di bulan itu; bruto = bagian kolam/coach (SESSION_REVENUE
// / SESSION_PAYOUT, termasuk pembaliknya) di bulan itu untuk sesi yang
// dipotong PPh MILIK MITRA ITU (kunci bookingId:ownerId). Mitra bebas potongan
// tidak punya baris PPh, jadi tidak muncul walau mitra lain di sesi yang sama
// dipotong. Koreksi sesi bulan lalu bisa membuat angka minus di bulan koreksi.

export type LedgerRow = {
  type: string;
  amount: number;
  poolId: string | null;
  coachProfileId: string | null;
  bookingId: string | null;
};

export type RecapRow = { kind: "Kolam" | "Coach"; ownerId: string; gross: number; pph: number };

export const pphKey = (bookingId: string, ownerId: string) => `${bookingId}:${ownerId}`;

export function buildPphRecap(monthRows: LedgerRow[], pphKeys: Set<string>): RecapRow[] {
  const out = new Map<string, RecapRow>();
  const row = (kind: RecapRow["kind"], ownerId: string) => {
    const key = `${kind}:${ownerId}`;
    if (!out.has(key)) out.set(key, { kind, ownerId, gross: 0, pph: 0 });
    return out.get(key)!;
  };
  for (const r of monthRows) {
    const kind = r.poolId ? "Kolam" : r.coachProfileId ? "Coach" : null;
    const owner = r.poolId ?? r.coachProfileId;
    if (!kind || !owner) continue;
    if (r.type === "PPH_WITHHELD") row(kind, owner).pph -= r.amount;
    else if ((r.type === "SESSION_REVENUE" || r.type === "SESSION_PAYOUT") && r.bookingId && pphKeys.has(pphKey(r.bookingId, owner))) {
      row(kind, owner).gross += r.amount;
    }
  }
  return [...out.values()].filter((r) => r.pph !== 0 || r.gross !== 0);
}

// "2026-10" -> rentang [1 Okt 00:00 WIB, 1 Nov 00:00 WIB). null = format salah.
export function monthRangeWib(month: string): { start: Date; end: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const start = new Date(Date.UTC(y, mo - 1, 1) - 7 * 3600_000);
  const end = new Date(Date.UTC(y, mo, 1) - 7 * 3600_000);
  return { start, end };
}
