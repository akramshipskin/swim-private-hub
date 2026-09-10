import { LegalPageLayout } from "@/components/legal-page-layout";

export default function SyaratKetentuanPage() {
  return (
    <LegalPageLayout title="Syarat & Ketentuan" updatedAt="10 September 2026">
      <p>
        Dengan mendaftar dan menggunakan aplikasi booking &amp; manajemen les renang
        Les Renang Cianjur ("Aplikasi"), kamu setuju sama syarat &amp; ketentuan di
        bawah ini.
      </p>

      <h2>1. Akun</h2>
      <ul>
        <li>Kamu wajib ngisi data pendaftaran (nama, no HP, password) dengan benar.</li>
        <li>Satu akun member bisa punya beberapa peserta (diri sendiri dan/atau anak).</li>
        <li>Kamu bertanggung jawab jaga kerahasiaan password akunmu sendiri.</li>
      </ul>

      <h2>2. Paket &amp; Sesi</h2>
      <ul>
        <li>Paket les terdiri dari sejumlah sesi yang berkurang tiap booking yang dihadiri.</li>
        <li>Paket aktif otomatis setelah pembayaran berhasil dikonfirmasi sistem.</li>
        <li>Sisa sesi dan jatah pembatalan berlaku per peserta, gak bisa dipindah ke peserta lain kecuali diproses manual oleh admin.</li>
      </ul>

      <h2>3. Booking &amp; Pembatalan</h2>
      <ul>
        <li>Booking jadwal tunduk pada ketersediaan slot coach yang dipilih.</li>
        <li>Pembatalan booking memotong jatah cancel yang tersedia di paketmu.</li>
        <li>Kehadiran ditandai oleh coach setelah sesi selesai; cuma sesi dengan status Hadir yang dihitung terpakai.</li>
      </ul>

      <h2>4. Pembayaran</h2>
      <p>
        Pembayaran diproses lewat Midtrans sebagai payment gateway resmi (virtual
        account, QRIS, e-wallet, kartu debit/kredit). Ketentuan pengembalian dana
        diatur terpisah di{" "}
        <a href="/kebijakan-pengembalian" className="text-brand-600 hover:underline">
          Kebijakan Pengembalian
        </a>
        .
      </p>

      <h2>5. Kewajiban Pengguna</h2>
      <ul>
        <li>Gunakan Aplikasi cuma buat keperluan booking les renang yang sah.</li>
        <li>Gak boleh menyalahgunakan sistem (misal booking ganda dengan itikad gak baik, manipulasi data).</li>
        <li>Data peserta (nama anak dll) wajib akurat -- kesalahan data jadi tanggung jawab yang mendaftarkan.</li>
      </ul>

      <h2>6. Batasan Tanggung Jawab</h2>
      <p>
        Aplikasi ini adalah alat bantu administrasi booking &amp; pembayaran. Kualitas
        pengajaran renang, keselamatan di kolam, dan operasional lapangan sepenuhnya
        tanggung jawab tempat les/coach terkait, bukan penyedia Aplikasi.
      </p>

      <h2>7. Perubahan Layanan</h2>
      <p>
        Fitur, harga paket, dan ketentuan ini bisa berubah sewaktu-waktu. Perubahan
        harga gak berlaku surut ke paket yang udah dibeli.
      </p>

      <h2>8. Hukum yang Berlaku</h2>
      <p>Syarat &amp; Ketentuan ini tunduk pada hukum Republik Indonesia.</p>

      <h2>Kontak</h2>
      <p>
        Pertanyaan soal Syarat &amp; Ketentuan: WhatsApp{" "}
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
