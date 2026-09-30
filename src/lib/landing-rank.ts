// Urutan coach & kolam di landing: yang asli lebih dulu, baru yang demo. Demo
// tetap mengisi slot yang kosong (maksimal 5 total), tapi tiap yang asli yang
// muncul menggeser satu demo (keputusan Hadi 29 Sep untuk coach, 30 Sep untuk
// kolam).
//
// Coach demo = email @example.com (konvensi yang sama dengan
// scripts/cleanup-demo-accounts.mts).
export const isDemoAccountEmail = (email: string | null | undefined) => /@example\.com$/i.test(email ?? "");

export const LANDING_SLOTS = 5;

export function rankLandingCoaches<T extends { id: string; name: string; email: string | null }>(
  coaches: T[],
  attendedByCoach: Map<string, number>,
  limit = LANDING_SLOTS,
): T[] {
  return [...coaches]
    .sort(
      (a, b) =>
        Number(isDemoAccountEmail(a.email)) - Number(isDemoAccountEmail(b.email)) ||
        (attendedByCoach.get(b.id) ?? 0) - (attendedByCoach.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

// Kolam demo: nama-nama di bawah (kolam contoh yang dibuat lewat
// scripts/seed-prod-demo.mts dan scripts/fill-demo-pools.mts), ATAU semua
// pemiliknya akun demo (@example.com). Kolam tanpa pemilik dan tanpa nama di
// daftar ini dianggap asli (dibuat admin).
export const DEMO_POOL_NAMES = [
  "Kolam Renang Melati",
  "Kolam Renang Tirta Asri",
  "Kolam Renang Bahari",
  "Kolam Renang Cempaka",
  "Kolam Renang Samudra",
] as const;

export function isDemoPool(pool: { name: string; ownerEmails: (string | null)[] }): boolean {
  if ((DEMO_POOL_NAMES as readonly string[]).includes(pool.name)) return true;
  return pool.ownerEmails.length > 0 && pool.ownerEmails.every(isDemoAccountEmail);
}

export function rankLandingPools<T extends { id: string; name: string; ownerEmails: (string | null)[] }>(
  pools: T[],
  soldByPool: Map<string, number>,
  limit = LANDING_SLOTS,
): T[] {
  return [...pools]
    .sort(
      (a, b) =>
        Number(isDemoPool(a)) - Number(isDemoPool(b)) ||
        (soldByPool.get(b.id) ?? 0) - (soldByPool.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}
