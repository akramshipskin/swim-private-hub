// Status yang ditampilkan halaman /pembayaran/sukses (URL "finish" Midtrans).
//
// Parameter transaction_status di URL bisa diubah siapa saja, jadi status di
// database (diisi webhook Midtrans) yang menang kalau order-nya ketemu. Webhook
// bisa telat beberapa detik: selama DB masih PENDING, pakai parameter URL.
// Tanpa order yang ketemu dan tanpa parameter = "unknown", bukan "gagal".
export type FinishStatus = "success" | "pending" | "failed" | "unknown";

export function resolveFinishStatus(
  dbStatus: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | null,
  urlStatus: string | undefined,
): FinishStatus {
  if (dbStatus === "SUCCESS") return "success";
  if (dbStatus === "FAILED" || dbStatus === "EXPIRED") return "failed";
  if (urlStatus === "capture" || urlStatus === "settlement") return "success";
  if (urlStatus === "pending") return "pending";
  if (urlStatus) return "failed"; // deny / cancel / expire / failure
  return dbStatus === "PENDING" ? "pending" : "unknown";
}
