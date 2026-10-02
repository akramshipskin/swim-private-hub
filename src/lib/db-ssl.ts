// Verifikasi sertifikat database penuh (Hadi 2 Okt malam, #12). Aktif hanya bila
// DATABASE_CA_CERT diisi (isi file CA Supabase, format PEM, dari dashboard
// Supabase > Database > SSL). Tanpa variabel itu perilaku koneksi tidak berubah.
// Parameter ssl* di alamat database dibuang saat CA dipakai: di driver pg,
// parameter di alamat menimpa opsi ssl, jadi CA tidak akan terpakai.
export function dbConnectionConfig(env: { DATABASE_URL?: string; DATABASE_CA_CERT?: string }) {
  const url = env.DATABASE_URL ?? "";
  const ca = env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
  if (!ca) return { connectionString: url };
  const u = new URL(url);
  for (const k of [...u.searchParams.keys()]) if (k.startsWith("ssl")) u.searchParams.delete(k);
  return { connectionString: u.toString(), ssl: { ca, rejectUnauthorized: true } };
}
