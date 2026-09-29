// Urutan coach di landing: coach asli lebih dulu, baru akun demo (email
// @example.com, konvensi yang sama dengan scripts/cleanup-demo-accounts.mts),
// lalu sesi Hadir terbanyak, lalu nama. Demo tetap mengisi slot yang kosong,
// tapi tiap coach asli yang muncul menggeser satu demo (keputusan Hadi 29 Sep).
export const isDemoAccountEmail = (email: string | null | undefined) => /@example\.com$/i.test(email ?? "");

export function rankLandingCoaches<T extends { id: string; name: string; email: string | null }>(
  coaches: T[],
  attendedByCoach: Map<string, number>,
  limit = 5,
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
