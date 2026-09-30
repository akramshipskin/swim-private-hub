// Nomor transaksi Midtrans berbentuk "PKG-<cuid>-<timestamp>" (panjang, ~40
// karakter). Member cukup melihat 8 karakter terakhir dari bagian cuid, dan
// admin/pengelola bisa mencocokkan ke nomor penuh lewat awalan/akhirannya.
// Nomor penuh tetap dipakai di sistem; ini murni tampilan.
export function shortOrderId(orderId: string): string {
  const parts = orderId.split("-");
  const core = parts.length >= 3 ? parts[1] : orderId;
  return `#${core.slice(-8).toUpperCase()}`;
}
