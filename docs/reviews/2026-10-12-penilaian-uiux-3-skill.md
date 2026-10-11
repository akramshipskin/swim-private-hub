# Penilaian UI/UX total 3 skill (12 Okt 2026, Opus)

Halaman laporan: https://claude.ai/artifact/StBpR2mEKEcdPcaZyJ3isU

Cakupan: 75 alamat (72 halaman kode, 3 pengalih), 5 peran + 3 keadaan khusus, 375/768/1280 x terang/gelap = 498 kunjungan versi jadi lokal dengan data ramai; semua halaman dilihat mata (landing per layar). Skill: design-taste-frontend, ui-ux-pro-max, web-design-guidelines; brand SPH menang bila bertentangan (Hadi 3A). Nilai keseluruhan 7,0/10 (keterbacaan teks HP 5,5; pola komponen 6,0; landing 6,5; tata letak 7,0; aksesibilitas 7,5; tema gelap 8,0; brand 8,0).

Perbaikan mekanis sudah dikirim: 27dbd57.

## Catatan mentah per peran
# Catatan tinjau visual (mentah)
## Publik
- landing HP: kartu tangkapan layar produk tampil kosong abu (perlu cek: gambar lazy tidak termuat saat tangkap penuh vs memang kosong). Angka "2 Kolam mitra" di bilah statistik (data asli kecil = melemahkan kepercayaan; keputusan Hadi). 6 butir alasan beruntun dgn garis = daftar panjang (design-taste 4.9). Tema gelap: landing tetap terang/krem (sengaja; tidak ikut tema).
- landing desktop: hero rapi, h1 3 baris relatif kecil di 1280 (±36px) dibanding ruang; mockup HP kanan bagus.
- pelatih/[id]: foto coach rusak -> teks alt "Foto Coach 4" tampil (lokal; tapi tidak ada cadangan avatar bila gambar gagal). Halaman tipis: tombol Daftar hitam kecil di bawah, beda gaya dgn landing (lime). Header Masuk/Daftar beda gaya dgn landing.
- register: isian nama peserta saat "Diri sendiri" tampak nonaktif abu + placeholder terpotong "(isi nama lengkap lebi". Tombol Daftar nonaktif abu sampai centang (kontras 3.9; pola tombol mati). Tanggal lahir "dd/mm/yyyy" (format browser).
- reset-password tautan mati: "Minta Tautan Baru" teks polos, bukan tombol (aksi utama satu-satunya).
- login/lupa/404: konsisten, bersih.
- daftar-coach/kolam HP: formulir panjang satu kolom; "5 langkah jadi mitra" diletakkan SESUDAH formulir (harusnya sebelum, atau di panel kiri desktop). Coach: isian tidak dikelompokkan (kolam punya judul "AKUN PEMILIK KOLAM").
- desktop auth (login/daftar): pola belah dua foto + formulir bagus; tapi panel kiri daftar-coach/kolam hanya foto kosong (login ada judul + 3 poin) -> tidak konsisten, dan ruang ideal untuk 5 langkah mitra.
- pelatih/[id] desktop: konten sempit rata kiri, ruang kanan kosong, avatar rusak, hierarki lemah, tombol Daftar kecil di bawah. Kandidat rombak (2 kolom: profil kiri, kolam + CTA kanan, CTA menempel).
- legal: rapi (max-w-prose). Ada em-dash di teks hukum (tidak diubah tanpa Hadi). Gelap OK.
- panduan: rapi; 6 kartu "Kenapa ini beda" seragam (pola 3 kartu identik berulang, design-taste 9.C) - ringan.
## Member
- Paket: dikelompokkan per kolam, urut tanggal dibuat; paket Berakhir bercampur dengan yang aktif (di data ramai, puluhan kartu "Sisa 0 ... Berakhir" sebelum paket aktif). Usul: aktif dulu, yang selesai dilipat "Paket selesai (n)".
- Peserta: tiap peserta menumpuk kartu paket (5+); "Nonaktifkan Peserta" merah tepat di bawah daftar paket (aksi berbahaya dekat isi). Desktop 2 kolom OK.
- Keamanan (2FA): pindah ke tampilan kartu login tanpa menu aplikasi (beda kerangka dari Profil) -> terasa keluar dari aplikasi. Usul: tampil di kerangka aplikasi.
- Profil desktop: kartu Hapus Akun di kanan atas sejajar Nama (aksi berbahaya paling menonjol). Usul: paling bawah.
- Riwayat Booking desktop: kartu sesi hanya selebar 1/3 layar, sisa kosong (1 kartu per tanggal). Usul: baris ringkas/tabel di desktop.
- Dasbor gelap: kartu "Jadwal berikutnya" berubah jadi blok lime penuh (terang menyilaukan di tema gelap; di terang charcoal). Pilihan brand, catat.
- Cari Coach: avatar abu generik untuk coach tanpa foto (wajar), kartu panjang (bio + kolam) - OK.
- Booking: tombol utama "Pilih Tanggal dan Jam" nonaktif abu menempel bawah sampai jam dipilih (wajar).
- Pembayaran sukses: ikon "?" untuk status belum diketahui - kurang meyakinkan; usul ikon jam/proses.
## Landing HP lengkap (27 layar, ditangkap per layar setelah gulir)
- FALSE ALARM: kartu tangkapan layar produk kosong di tangkapan otomatis = gambar lazy belum dimuat; setelah digulir semua gambar termuat (dicek naturalWidth).
- Bagian Coach: coach tanpa foto tampil sebagai blok lime raksasa berisi inisial ("PU", "C7", "CU") -> terlihat belum jadi. Usul: landing hanya menampilkan coach berfoto, atau kartu kecil.
- Bagian Kolam: kolam tanpa coach tampil "0 coach / Segera hadir / Hubungi admin" (data lokal; cek live). Usul: sembunyikan kolam tanpa coach dari landing.
- Panjang 27 layar, 12+ bagian, banyak bagian teks berderet; bagian mitra coach (gelap) + kolam mitra ikut di landing iklan orang tua. Usul (keputusan Hadi): pindahkan bagian mitra ke halaman daftar-coach/daftar-kolam, potong landing.
- Garis lime kecil berliuk muncul di kanan logo pada header saat digulir (dekorasi nyasar?) - cek.
- Bilah "Daftar gratis" menempel bawah sepanjang halaman + tombol Daftar di header: wajar untuk iklan.
## Coach
- Jadwal HP: tiap jam = satu kartu penuh + tombol Hapus (puluhan kartu sama tinggi). Usul: jam sebagai keping (chip) 2-3 kolom per hari; desktop sudah 3 kolom.
- Riwayat Sesi: tautan "Update milestone" menempel di belakang nama peserta dalam satu kalimat (tersamar, sulit diketuk). Usul: tombol kecil terpisah.
- Banyak teks 12px abu (text-xs text-text-subtle) untuk info penting (nama akun, sisa sesi, tanggal) di semua kartu peran coach/member -> sulit dibaca di HP (aturan ui-ux: badan teks HP >=16px; minimal 14px untuk info).
- Profil: isian unggah file bawaan browser ("Choose file / No file chosen", bahasa Inggris di Chrome) tidak bergaya. Usul: tombol unggah bergaya brand.
- Saldo/Harga: isian terkunci abu sampai "Ubah" ditekan - pola konsisten, OK.
- Desktop dan gelap: rapi; sidebar aktif hijau zaitun di gelap.
## Pemilik kolam
- Jadwal Kolam (HP+desktop): tiap sesi = kapsul teks panjang 2 baris (jam, coach, peserta, akun, kode) bertumpuk puluhan; "Jam kosong: Coach X" juga satu kapsul per coach. Sulit dipindai petugas loket. Usul: baris tabel per jam (jam | peserta | coach | KODE tebal/mono), jam kosong diringkas "13 jam kosong".
- Navigasi tanggal HP: "Sebelumnya", pilih tanggal + Lihat, "Berikutnya" menjadi 3 baris. Usul: satu baris ‹ tanggal ›.
- Info Kolam: formulir panjang terkunci abu; tombol "Ubah Info Kolam" di BAWAH formulir (gulir ke bawah untuk membuka, lalu ke atas untuk mengisi). Usul: tombol Ubah di atas, atau langsung bisa diisi + Simpan menempel.
- Dasbor: grafik "Jam ramai hari ini" dan "Terisi 7 hari" bagus, bermakna.
- Gelap: rapi; kartu saldo lime penuh di gelap (sama dgn member).

## Audit kode (web-design-guidelines)
```
berkas tsx: 224

== role=alert/aria-live: 82

== autoFocus: 2
  src/app/(auth)/login/login-form.tsx:143  autoFocus
  src/components/ui/confirm-dialog.tsx:52  <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading} autoFocus>

== tabular-nums: 24

== hover: state: 179

== en-dash – (pemisah): 35
  src/app/admin/booking-overview/booking-overview-board.tsx:184  {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
  src/app/admin/laporan-kehadiran/page.tsx:57  {formatDateLabel(a.date)} · {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
  src/app/brandguideline/brandguideline-view.tsx:418  <p className="mt-1 text-xs text-text-muted">Geometris, berkarakter. Tebal 600–800.</p>
  src/app/brandguideline/brandguideline-view.tsx:423  <p className="mt-1 text-xs text-text-muted">Mudah dibaca di HP. Tebal 400–700.</p>
  src/app/brandguideline/brandguideline-view.tsx:428  <p className="mt-1 text-xs text-text-muted">Kode booking, nomor referensi. Tebal 500–600.</p>
  src/app/brandguideline/brandguideline-view.tsx:496  title="08.00–09.00"
  src/app/brandguideline/brandguideline-view.tsx:693  ["Kecepatan gerak", "150–300 md untuk aplikasi, 400–700 md untuk landing; hanya geser dan pudar"],
  src/app/brandguideline/brandguideline-view.tsx:732  <li>Jam sesi: 08.00–09.00. Waktu selalu WIB.</li>
  src/app/coach/dashboard/page.tsx:81  ? { eyebrow: "Sesi berikutnya hari ini", title: `${formatTimeWib(nextToday.startTime)}–${formatTimeWib(nextTod
  src/app/coach/dashboard/page.tsx:165  {b.package.dependent.name} · {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
  src/app/coach/jadwal/add-slot-form.tsx:78  Rentang jam otomatis dipecah per jam. Misalnya 08.00–10.00 menjadi 2 jam terpisah (08.00–09.00
  src/app/coach/jadwal/add-slot-form.tsx:79  dan 09.00–10.00), masing-masing bisa dibooking member yang berbeda. Jam 12.00–13.00 (istirahat)
  src/app/coach/jadwal/page.tsx:144  {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
  src/app/coach/jadwal/page.tsx:167  label={`${formatTimeWib(a.startTime)}–${formatTimeWib(a.endTime)}`}
  src/app/coach/jadwal/page.tsx:172  label={`${formatTimeWib(a.startTime)}–${formatTimeWib(a.endTime)}`}
  src/app/coach/jadwal/page.tsx:214  {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
  src/app/coach/riwayat-sesi/page.tsx:103  {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
  src/app/member/booking/booking-board.tsx:262  timeRange: `${formatTime(target.startTime)}–${formatTime(target.endTime)}`,
  src/app/member/booking/booking-board.tsx:596  {formatTime(s.startTime)}–{formatTime(s.endTime)}
  src/app/member/booking/booking-board.tsx:619  {formatTime(s.startTime)}–{formatTime(s.endTime)}
  src/app/member/booking/booking-board.tsx:712  ? `${cancelTarget.coach.name}, ${formatTime(cancelTarget.startTime)}–${formatTime(cancelTarget.endTime)}. Sisa
  src/app/member/booking/page.tsx:74  hours: p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : null,
  src/app/member/dashboard/page.tsx:103  {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
  src/app/member/dashboard/page.tsx:123  title={`${formatTimeWib(next.availability.startTime)}–${formatTimeWib(next.availability.endTime)}`}
  src/app/member/paket/page.tsx:465  {[pool.address, pool.openTime && pool.closeTime && `Buka ${pool.openTime}–${pool.closeTime}`]
  src/app/member/riwayat/page.tsx:130  {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
  src/app/page.tsx:137  hours: p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : null,
  src/app/panduan/panduan-view.tsx:111  { title: "Pilih jam mulai dan selesai", body: "Rentang jam otomatis dipecah per jam. Contoh: 08.00–10.00 menja
  src/app/pelatih/[coachId]/page.tsx:150  Buka {pool.openTime}–{pool.closeTime}
  src/app/pool/dashboard/page.tsx:96  ? { eyebrow: "Les berikutnya hari ini", title: `${formatTimeWib(nextLes.startTime)}–${formatTimeWib(nextLes.en
  src/app/pool/dashboard/page.tsx:124  <p className="text-sm text-text">Jam buka: {p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : "belu
  src/app/pool/jadwal/page.tsx:120  {String(r.hour).padStart(2, "0")}:00–{String(r.hour + 1).padStart(2, "0")}:00
  src/app/pool/laporan/page.tsx:215  <dd className="mt-0.5 font-mono text-sm text-text-muted">{r.pph > 0 ? <>&minus;{formatRupiah(r.pph)}</> : "–"}
  src/app/pool/laporan/page.tsx:254  {r.pph > 0 ? <>&minus;{formatRupiah(r.pph)}</> : "–"}
  src/components/dashboard.tsx:97  {formatTimeWib(s.startTime)}–{formatTimeWib(s.endTime)} <span className="font-medium text-brand-700">· {s.pool

== em-dash —: 27
  src/app/admin/kolam/affiliate-coach-form.tsx:69  — pilih coach —
  src/app/admin/koreksi-saldo/adjust-form.tsx:75  <span>Membetulkan Salah Catat <span className="text-text-subtle">— tidak ada pihak lain yang ikut berubah</spa
  src/app/admin/koreksi-saldo/adjust-form.tsx:79  <span>Dari/ke Pendapatan Platform <span className="text-text-subtle">— saldo platform ikut berkurang/bertambah
  src/app/coach/jadwal/page.tsx:159  ? "Sudah mulai — tandai di Riwayat Sesi"
  src/app/keamanan/page.tsx:48  {isAdmin ? "Akun admin wajib memakai verifikasi 2 langkah." : "Verifikasi 2 langkah (2FA) — tidak wajib, tapi 
  src/app/kebijakan-cookie/page.tsx:23  <strong>Cookie sesi masuk (login)</strong> — bersifat esensial,
  src/app/kebijakan-cookie/page.tsx:28  <strong>Penyimpanan lokal preferensi tampilan</strong> — menyimpan
  src/app/kebijakan-cookie/page.tsx:32  <strong>Penyimpanan sesi sumber pendaftaran</strong> — menyimpan
  src/app/kebijakan-cookie/page.tsx:39  <strong>Cookie iklan Meta (Meta Pixel: _fbp, _fbc)</strong> — dipasang
  src/app/kebijakan-pengembalian/page.tsx:23  <strong>bukan</strong> merupakan pengembalian dana — sesi tetap tersedia
```
