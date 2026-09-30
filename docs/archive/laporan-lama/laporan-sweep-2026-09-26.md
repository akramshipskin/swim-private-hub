# Laporan sweep menyeluruh — 25 Sep 2026 (malam–pagi)

Branch: `sweep/malam` — 6 commit, **BELUM di-push**. Model: Opus 5.5.
Tidak ada migrasi database baru (aman di-push tanpa langkah prod dulu).

## PALING PENTING — perlu di-push secepatnya
Dua kebocoran data yang SEKARANG MASIH ADA DI PRODUKSI (commit 5b85ec5):
1. **Member yang booking menerima data akun coach lengkap** di balasan API
   `POST /api/booking`: hash password, No HP, IP pendaftaran, data 2FA coach.
   Siapa pun bisa lihat lewat alat developer browser.
2. **Halaman Kelola User (admin)** mengirim hash password & kunci 2FA semua
   member ke browser admin. Dicek di produksi (baca saja): 4 baris bocor.

Satu lagi soal keamanan (4b46d15): halaman wajib ganti password menerima password
sementara yang sama -> password dari admin / CSV import tetap bisa dipakai.

## Cara kerja
- DB dev lokal + server dev + akun QA 4 peran. Produksi hanya DIBACA (sesi admin lu).
- Tiap halaman: desktop DAN HP 375px, diukur otomatis (teks rusak, geser samping,
  tombol < 44px, kolom tanpa label, tombol tanpa nama, gambar tanpa alt, teks < 12px).
- Pindai HTML semua halaman untuk data rahasia (hash password, 2FA, IP).
- Kontras warna dihitung otomatis semua halaman, tema terang & gelap (WCAG AA 4.5:1).
- Standar UI: skill UI UX Pro Max (aksesibilitas, area sentuh, kontras, form, gerak).
- Setiap bug logika: tes ditulis, dibuktikan GAGAL tanpa perbaikan, lalu lolos.

## Halaman yang disapu (desktop + HP)
- Admin 13 + detail user (semua 18 akun): dashboard, jadwal booking, email, kinerja coach,
  kolam, bagi hasil, paket, uang masuk, pesan, kelola user, pencairan, profil, keamanan.
- Coach 7, Member 9, Pemilik kolam 8, Publik 13 (beranda, login, daftar x3, panduan, 4 legal,
  status bayar sukses/gagal, profil publik coach, 404), layar "pendaftaran diterima",
  ganti password wajib.
- Yang muncul setelah diklik: menu akun, chat, dialog konfirmasi, kalender.
- Halaman diulang di HP SETELAH ada data (elemen yang hanya muncul dengan data).
- Produksi (baca saja): 16 halaman status 200, tanpa teks rusak; angka dashboard konsisten
  (saldo mengendap 93.750 = kolam + coach + platform + PPN).

## Alur yang dijalankan (DB lokal) — hasil
| Alur | Hasil |
|---|---|
| Admin tambah coach ke kolam | OK |
| Coach buat slot 08-10 | OK, 2 slot |
| Member booking / batal (dialog, Esc) / jatah habis -> link WA, API 409 | OK |
| Coach tandai Hadir -> bagi hasil 93.750 = kolam 28.125 + coach 51.563 + platform 12.555 + PPN 1.507 | Cocok hitung manual |
| Cair > saldo ditolak, < min ditolak, pas berhasil | OK |
| Batalkan Hadir setelah uang diajukan cair | Ditolak benar |
| Admin Tolak pencairan (saldo balik) / Tandai Dibayar (no. ref wajib) | OK, ledger cocok |
| Admin batalkan booking (sesi kembali, jatah member tidak berkurang) | OK |
| Webhook Midtrans disimulasikan lokal, 7 skenario | Semua benar |
| Daftar member (nama/HP/email dibakukan, S&K tercatat), HP dobel beda format | OK, 409 |
| Tambah peserta, minta hapus akun, admin setujui (anonim), login setelah dihapus | OK, ditolak |
| Daftar coach -> admin aktifkan -> login | OK |
| Daftar kolam -> admin setujui | Kolam aktif, TAPI akun pemilik tetap nonaktif (lihat keputusan #1) |
| Kolam usul paket (jatah kosong ditolak) -> admin setujui | OK |
| Admin buat user -> login pertama wajib ganti password | OK (+ bug password sama, diperbaiki) |
| Admin balas pesan, edit nama profil | OK |
| 2FA coach (pasang/login/reset/matikan) | OK (dicek sebelumnya malam ini) |

## Temuan & perbaikan (6 commit)
| # | Temuan | Dampak | Commit |
|---|---|---|---|
| 1 | API booking kirim data akun coach (hash password dll) ke member | Kebocoran data | 5b85ec5 |
| 2 | Kelola User kirim hash password + kunci 2FA member ke browser | Kebocoran data | 5b85ec5 |
| 3 | Ganti password wajib menerima password sementara yang sama | Keamanan | 4b46d15 |
| 4 | Kolom angka kosong tersimpan 0: sisa sesi member jadi 0 (form tidak wajib), komisi 0%, jatah batal 0 | Uang/sesi hilang | 1b8edea |
| 5 | Form admin Tambah User / Tambah Peserta / Assign Paket: sukses tanpa pesan, form tetap terisi | Admin kirim ulang -> "sudah terdaftar" | 4b46d15 |
| 6 | CSS global mematikan semua `truncate` (12 tempat) | Nama panjang turun baris | 1b8edea |
| 7 | Kontras gagal WCAG: teks keterangan, link/tombol ghost di tema gelap (2.9:1), hijau WA (2:1), warning | Sulit dibaca | eba8502 |
| 8 | Area sentuh < 44px di HP: halaman publik, menu akun, chat, dropdown Hadir, tombol WA, kalender, salin rekening | Susah ditekan | 1b8edea, f4fca52 |
| 9 | `<a>` membungkus `<button>` (HTML tidak valid) di 404, status bayar, profil coach, pendaftaran diterima | Pembaca layar/keyboard | f6ed3df |
| 10 | Dashboard admin hitung paket akun nonaktif | Angka tidak konsisten | 1b8edea |
| 11 | Tombol Beli berputar selamanya saat koneksi putus | Member bingung | 1b8edea |
| 12 | Label hilang (kolom nominal, dropdown peserta/coach, kolom cari), chip keahlian tanpa status, dialog tanpa Esc | Aksesibilitas | 1b8edea, f6ed3df |
| 13 | Jadwal coach tanpa kolam: pesan "tambah di atas" padahal tidak ada form | Membingungkan | f6ed3df |
| 14 | Nama kolam saat daftar tidak dirapikan (pemilik dirapikan) | Tidak konsisten | f6ed3df |
| 15 | Tombol nonaktif slate kebiruan, label putih tak terbaca; tanpa "kurangi gerakan" | Konsistensi | eba8502 |

Verifikasi akhir di branch: tsc 0, lint 0 error 0 warning, tes unit 409 lolos,
tes race 102 lolos, build lolos. Tes baru: 5 (semua terbukti gagal tanpa perbaikan).

## False alarm (dicek, bukan bug)
- Tombol "tanpa nama" di Kelola Kolam: ada di bagian tertutup (details).
- Link profil publik coach "localhost:3000": dari `.env` lokal (produksi pakai domain; belum
  bisa gue lihat di produksi karena butuh login coach).
- Elemen halaman dobel: Next 16 menyimpan halaman sebelumnya tersembunyi.
- Dropdown Hadir sempat tampil salah: server dev lambat.
- Kontras 1.06-1.27 pada tombol: animasi transisi belum jalan di tab background
  (dibuktikan: animasi dimatikan -> 0 temuan).
- "Jum" 1.14: alat ukur salah baca format warna oklab (teks putih di latar gelap).
- "Nama tidak boleh kosong" di Profil: cara uji gue melewati tombol "Edit Nama".
- Pesan login untuk coach yang belum disetujui: sengaja umum (tidak membocorkan akun ada).
- Link di dalam kalimat (S&K, email di halaman legal) < 44px: pengecualian WCAG.

## Keputusan lu (tidak gue ubah)
1. **Setujui kolam** hanya mengaktifkan kolam; akun pemilik tetap tidak bisa login sampai
   diaktifkan terpisah di Kelola User. Mau sekalian mengaktifkan pemilik?
2. **Dashboard admin tidak punya penanda "coach/pemilik baru menunggu persetujuan".**
   Akun demo yang dinonaktifkan tidak bisa dibedakan dari pendaftar baru (tidak ada kolom
   "pernah disetujui"). Perlu kolom baru (migrasi) kalau mau penanda ini.
3. Dropdown "tambah coach ke kolam" ikut menampilkan coach nonaktif. Sengaja?

## Batasan yang tersisa (diketahui)
- Sel tanggal kalender di HP 34x40px (lebar 44 tidak muat tanpa popup meluber). Di atas
  batas minimum WCAG AA (24px), di bawah saran 44px.
- Teks keterangan 11px masih di: label hari kalender, label grup menu samping, menu bawah HP.

## Tidak dicoba (dan alasannya)
- Chat bantuan (AI): memanggil API AI sungguhan dengan kunci lu.
- Kirim/balas email admin: mengirim email sungguhan (Resend).
- Checkout Midtrans: `.env` lokal pakai kunci produksi (larangan). Webhook diuji lokal.
- Upload foto/sertifikat: kunci Supabase tidak ada di laptop.
- Import member dari Excel: hanya lewat tes unit yang ada, tidak lewat layar.
- Push notif, Safari iOS, HP asli: butuh perangkat asli.

## Data uji di DB dev lokal (bukan produksi)
Akun "Sweep ...", "Member Buatan/Kedua Admin", kolam "Kolam Sweep Uji", paket "Paket Sweep 4x",
beberapa booking/pencairan uji. Tidak mempengaruhi produksi.

## Langkah berikutnya (urut)
1. Review singkat branch `sweep/malam` (6 commit), lalu merge + push ke main.
   Tidak ada migrasi. Vercel deploy otomatis.
2. Jawab 3 keputusan di atas.
