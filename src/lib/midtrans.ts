import midtransClient from "midtrans-client";

// Service provider posture (revisi 2026-09-12, gantiin connector): 1 akun
// Midtrans platform buat SEMUA kolam -- checkout dan verifikasi webhook
// pake kredensial global ini, bukan per-pool lagi.
export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export function platformServerKey(): string {
  return process.env.MIDTRANS_SERVER_KEY!;
}
