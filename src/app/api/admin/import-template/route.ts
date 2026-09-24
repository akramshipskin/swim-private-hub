import { requireRole } from "@/lib/require-role";
import * as XLSX from "xlsx";

// Kolom & urutan ini HARUS sinkron sama parser di admin/users/actions.ts
// (importMembersXlsx) -- header di-cocokin case-insensitive lewat helper
// `pick()` di sana, jadi nama kolom boleh beda kapital/spasi dikit, tapi
// makna tiap kolom harus tetep sama kayak di sini.
const HEADERS = [
  "Nama Member",
  "No HP",
  "Email (opsional)",
  "Nama Peserta/Anak",
  "Paket Aktif",
  "Sisa Sesi",
];

// Baris contoh -- nunjukin 2 pola: (1) member booking buat diri sendiri
// dengan paket aktif, (2) member dengan 2 anak, 1 udah punya paket 1
// belum. Baris dengan No HP sama = peserta beda dari member yang sama.
const EXAMPLE_ROWS = [
  ["Budi Santoso", "081234567890", "", "", "8x Renang", "5"],
  ["Siti Aminah", "081298765432", "siti@email.com", "Rafi", "Private 2 Bulan", "6"],
  ["Siti Aminah", "081298765432", "siti@email.com", "Nadia", "", ""],
];

export async function GET() {
  await requireRole("ADMIN");

  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...EXAMPLE_ROWS]);
  sheet["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length, 16) }));

  const infoSheet = XLSX.utils.aoa_to_sheet([
    ["Cara isi:"],
    ["- 1 baris = 1 peserta. Member yang punya >1 anak, ulang No HP yang sama di baris berikutnya."],
    ["- \"Nama Peserta/Anak\" kosong = peserta itu diri sendiri member (bukan anak)."],
    ["- \"Paket Aktif\" isi nama paket dari Katalog Paket (kalau cocok, total sesi/jatah batal ikut katalog itu)."],
    ["  Kalau namanya tidak ada di katalog, tetap dibuat paket custom pakai nilai \"Sisa Sesi\" sebagai total sesi juga."],
    ["- \"Paket Aktif\" & \"Sisa Sesi\" boleh dikosongkan kalau peserta itu belum punya paket aktif."],
    ["- Baris tanpa \"Nama Peserta/Anak\" DAN tanpa \"Paket Aktif\" = member polos, belum ada peserta terdaftar."],
    ["  (member akan diminta mengisi peserta sendiri saat login pertama, seperti alur biasa)."],
    ["- Password sementara tiap member dibuat acak dan tampil di layar setelah import — wajib ganti saat login pertama."],
    ["- No HP yang sudah terpakai email/HP-nya di sistem akan di-skip (dilaporkan di hasil import)."],
  ]);
  infoSheet["!cols"] = [{ wch: 100 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  XLSX.utils.book_append_sheet(workbook, infoSheet, "Cara Isi");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-users.xlsx"',
    },
  });
}
