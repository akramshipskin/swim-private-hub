import midtransClient from "midtrans-client";
import { decryptPoolCredential } from "@/lib/pool-credentials";

type PoolMidtransCredentials = {
  midtransServerKeyEnc: string | null;
  midtransClientKeyEnc: string | null;
  midtransIsProduction: boolean;
};

// Connector posture (locked /plan-eng-review 2026-09-12): platform gak
// pernah pegang dana, jadi TIDAK ADA akun Midtrans milik platform di
// app ini -- tiap transaksi wajib pake Server Key + Client Key milik
// KOLAM itu sendiri. Null kalau pool belum setup Midtrans -- caller
// WAJIB fallback ke instruksi manual/transfer, jangan anggap ini selalu
// berhasil.
export function snapForPool(pool: PoolMidtransCredentials) {
  if (!pool.midtransServerKeyEnc || !pool.midtransClientKeyEnc) return null;
  return new midtransClient.Snap({
    isProduction: pool.midtransIsProduction,
    serverKey: decryptPoolCredential(pool.midtransServerKeyEnc),
    clientKey: decryptPoolCredential(pool.midtransClientKeyEnc),
  });
}

// Buat verifikasi signature webhook -- butuh server key kolam yang
// bersangkutan, bukan snap client penuh.
export function serverKeyForPool(
  pool: Pick<PoolMidtransCredentials, "midtransServerKeyEnc">
): string | null {
  if (!pool.midtransServerKeyEnc) return null;
  return decryptPoolCredential(pool.midtransServerKeyEnc);
}
