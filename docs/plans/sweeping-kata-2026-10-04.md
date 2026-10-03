# Sweeping pemakaian kata (4 Okt 2026, permintaan Hadi 3 Okt malam #9A)

Hadi: bahasa di aplikasi terasa terlalu santai dan kadang salah (contoh "diajar" — "Paling sering diajar"
di dashboard member), istilah harus konsisten dan sama di setiap peran untuk setiap penyebutan.

## Acuan
- brand-kit/MESSAGING.md bagian 3 (nada), 4 (istilah baku + daftar kata santai yang dilarang), 5 (angka), 6 (tombol & pesan).
- Sapaan "kamu" (bukan "Anda"), formal secukupnya, tidak gaul, tidak kaku. Bahasa Indonesia baku sehari-hari
  (seperti aplikasi bank/e-commerce Indonesia yang rapi), bukan bahasa daerah dan bukan singkatan chat.
- Rupiah: "Rp 1.000" (spasi setelah Rp) di kalimat; angka dari formatRupiah sudah benar.
- Kalimat maksimal ±25 kata, satu ide per kalimat. Tidak berkesan tulisan AI (hindari "seamless", "dengan mudah",
  "solusi terbaik", tanda pisah panjang beruntun, tiga kata sifat berjejer).

## Yang DIUBAH
Hanya teks yang dilihat pengguna: isi JSX, label, placeholder, aria-label, judul tab (metadata), pesan error/sukses
yang dikembalikan server ke tampilan, isi notifikasi HP (notifyUser/notifyAdmins/sendPush: title & body), email.

## Yang DILARANG disentuh
- Komentar kode (boleh tetap santai), nama variabel/fungsi, logika, angka, kondisi, kelas CSS, URL.
- Teks hukum: src/app/syarat-ketentuan, kebijakan-privasi, kebijakan-pengembalian, kebijakan-cookie,
  perjanjian-coach, mou-kolam (dan isi persetujuan di src/app/perjanjian bila itu kutipan pasal).
- Arti kalimat: jangan menambah/mengurangi janji, angka, syarat, atau aturan. Bila kalimat ambigu soal aturan
  bisnis, JANGAN tebak: tulis di laporan "tidak jelas".
- File yang sedang dipegang Claude: src/lib/coach-slot-watch.ts, src/lib/cancel-booking.ts, src/lib/milestone-data.ts,
  src/app/milestone/actions.ts, src/app/api/payment/checkout/route.ts, src/app/api/booking/route.ts, src/lib/nav-links.ts.
- Landing (src/app/landing-*.tsx, src/app/page.tsx, coach-leaders.tsx): hanya perbaiki kata santai/salah dan
  istilah, JANGAN menulis ulang copy jualan.

## Bila mengubah teks yang diuji
Cari teksnya di tes (grep di src dan tests) dan perbarui harapan tes yang sama persis. Jalankan
`npx tsc --noEmit` dan `npx vitest run` untuk file yang tersentuh sebelum melapor.

## Laporan (maks ~40 baris)
Jumlah file & potongan diubah, contoh 10 perubahan penting LAMA -> BARU, istilah yang kamu seragamkan,
hal "tidak jelas", hasil tsc & vitest.
