import { LegalPageLayout } from "@/components/legal-page-layout";

export default function KebijakanPrivasiPage() {
  return (
    <LegalPageLayout title="Kebijakan Privasi" updatedAt="10 September 2026">
      <p>
        Kebijakan ini menjelaskan data apa aja yang dikumpulkan Les Renang Cianjur
        lewat aplikasi booking &amp; manajemen les renang ini, buat apa dipakai, dan
        hak kamu atas data itu. Berlaku buat semua pengguna: orang tua/member, coach,
        dan admin.
      </p>

      <h2>Data yang Dikumpulkan</h2>
      <ul>
        <li>Nama, nomor HP, dan email (email opsional) saat daftar akun.</li>
        <li>Nama anak/peserta les yang didaftarkan di bawah akun member.</li>
        <li>Riwayat booking, kehadiran, dan sisa sesi paket.</li>
        <li>
          Data transaksi pembayaran (nominal, status, metode) -- nomor kartu/rekening
          gak pernah disimpan di sistem kami, itu ditangani langsung sama Midtrans
          sebagai payment gateway resmi.
        </li>
        <li>Sumber pendaftaran (misal dari link WA/IG) buat keperluan internal, bukan dijual ke pihak ketiga.</li>
      </ul>

      <h2>Tujuan Penggunaan Data</h2>
      <ul>
        <li>Ngatur booking, jadwal coach, dan sisa sesi paket kamu.</li>
        <li>Memproses pembayaran dan mengaktifkan paket otomatis.</li>
        <li>Mengirim notifikasi terkait booking (kalau diaktifkan).</li>
        <li>Analitik pemakaian aplikasi secara agregat buat perbaikan produk.</li>
      </ul>

      <h2>Berbagi Data ke Pihak Ketiga</h2>
      <p>
        Kami cuma berbagi data seperlunya ke pihak yang bantu jalanin layanan ini:
      </p>
      <ul>
        <li>
          <strong>Midtrans</strong> -- payment gateway resmi, nerima data transaksi
          (nominal, order ID, nama, email) buat memproses pembayaran.
        </li>
        <li>
          <strong>Vercel Analytics</strong> -- analitik kunjungan halaman yang
          <em> cookieless</em> (gak pakai cookie pelacak individual).
        </li>
      </ul>
      <p>Kami gak menjual atau menyewakan data pribadi kamu ke pihak manapun.</p>

      <h2>Cookie &amp; Penyimpanan Lokal</h2>
      <p>
        Aplikasi ini pakai sesi login (cookie) dan local/session storage buat fitur
        tema gelap-terang dan lain-lain. Detail lengkapnya ada di{" "}
        <a href="/kebijakan-cookie" className="text-brand-600 hover:underline">
          Kebijakan Cookie
        </a>
        .
      </p>

      <h2>Keamanan Data</h2>
      <p>
        Password disimpan dalam bentuk hash (bukan teks biasa), dan akses ke data
        dibatasi sesuai peran (member cuma bisa lihat data anaknya sendiri, coach
        cuma lihat jadwalnya, dst).
      </p>

      <h2>Hak Kamu Atas Data</h2>
      <p>
        Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, kamu berhak:
      </p>
      <ul>
        <li>Minta salinan data pribadi yang kami simpan.</li>
        <li>Minta koreksi data yang salah/gak akurat.</li>
        <li>Minta penghapusan akun &amp; data pribadi (dengan catatan riwayat transaksi yang wajib disimpan sesuai ketentuan hukum tetap ada).</li>
        <li>Menarik persetujuan penggunaan data untuk keperluan non-esensial (misal notifikasi).</li>
      </ul>
      <p>
        Buat pakai hak-hak di atas, hubungi kami lewat kontak di bawah.
      </p>

      <h2>Perubahan Kebijakan</h2>
      <p>
        Kebijakan ini bisa diperbarui sewaktu-waktu. Perubahan signifikan bakal
        diinformasikan lewat aplikasi.
      </p>

      <h2>Kontak</h2>
      <p>
        Pertanyaan soal privasi/data pribadi: WhatsApp{" "}
        <a href="https://wa.me/6281573400086" className="text-brand-600 hover:underline">
          +62 815-7340-0086
        </a>{" "}
        atau email{" "}
        <a href="mailto:[EMAIL]" className="text-brand-600 hover:underline">
          [EMAIL]
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
