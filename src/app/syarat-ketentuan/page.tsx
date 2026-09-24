import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { TERMS_UPDATED_AT } from "@/lib/legal";
import { BUSINESS_ADDRESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | Swim Private Hub",
  description: "Ketentuan penggunaan aplikasi pemesanan dan manajemen les renang Swim Private Hub.",
};

export default function SyaratKetentuanPage() {
  return (
    <LegalPageLayout title="Syarat & Ketentuan" updatedAt={TERMS_UPDATED_AT}>
      <p>
        Dengan mendaftar dan menggunakan aplikasi pemesanan dan manajemen les
        renang Swim Private Hub (&ldquo;Aplikasi&rdquo;), Pengguna menyatakan setuju
        terhadap Syarat &amp; Ketentuan berikut ini.
      </p>

      <h2>1. Akun</h2>
      <ul>
        <li>Pengguna wajib mengisi data pendaftaran (nama, nomor telepon, kata sandi) dengan benar dan akurat.</li>
        <li>Satu akun member dapat memiliki beberapa peserta les (diri sendiri dan/atau anak).</li>
        <li>Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi akunnya masing-masing.</li>
      </ul>

      <h2>2. Paket dan Sesi</h2>
      <ul>
        <li>Paket les terdiri atas sejumlah sesi yang berkurang setiap kali pemesanan dibuat, dan dikembalikan apabila pemesanan dibatalkan sesuai ketentuan pembatalan.</li>
        <li>Paket hanya dapat digunakan untuk pemesanan di kolam tempat paket tersebut dibeli. Pemesanan di kolam mitra lain dilakukan dengan membeli paket 1 sesi di kolam tersebut, yang hanya tersedia bagi pengguna yang masih memiliki paket aktif.</li>
        <li>Paket akan aktif secara otomatis setelah pembayaran berhasil dikonfirmasi oleh sistem.</li>
        <li>Sisa sesi dan jatah pembatalan berlaku per peserta, dan tidak dapat dipindahkan ke peserta lain kecuali melalui proses manual oleh administrator.</li>
      </ul>

      <h2>3. Pemesanan dan Pembatalan</h2>
      <ul>
        <li>Pemesanan jadwal tunduk pada ketersediaan slot pelatih (coach) yang dipilih.</li>
        <li>Pembatalan pemesanan akan mengurangi jatah pembatalan yang tersedia pada paket Pengguna.</li>
        <li>Kehadiran ditandai oleh pelatih setelah sesi selesai; hanya sesi berstatus Hadir yang dihitung sebagai terpakai.</li>
      </ul>

      <h2>4. Pembayaran</h2>
      <p>
        Pembayaran diproses melalui Midtrans selaku penyedia gerbang pembayaran
        resmi (virtual account, QRIS, dompet digital, serta kartu debit/kredit).
        Ketentuan mengenai pengembalian dana diatur secara terpisah pada{" "}
        <a href="/kebijakan-pengembalian" className="text-brand-600 hover:underline">
          Kebijakan Pengembalian
        </a>
        .
      </p>

      <h2>5. Kewajiban Pengguna</h2>
      <ul>
        <li>Menggunakan Aplikasi semata-mata untuk keperluan pemesanan les renang yang sah.</li>
        <li>Tidak menyalahgunakan sistem, termasuk namun tidak terbatas pada pemesanan ganda dengan itikad tidak baik atau manipulasi data.</li>
        <li>Data peserta (nama anak, dan sebagainya) wajib akurat; kesalahan data menjadi tanggung jawab Pengguna yang mendaftarkan.</li>
      </ul>

      <h2>6. Batasan Tanggung Jawab</h2>
      <p>
        Aplikasi ini merupakan sarana bantu administrasi pemesanan dan
        pembayaran. Kualitas pengajaran renang, keselamatan di area kolam, dan
        operasional lapangan sepenuhnya menjadi tanggung jawab pihak
        penyelenggara les/pelatih terkait, dan bukan tanggung jawab penyedia
        Aplikasi.
      </p>

      <h2>7. Perubahan Layanan</h2>
      <p>
        Fitur, harga paket, dan ketentuan ini dapat berubah sewaktu-waktu.
        Perubahan harga tidak berlaku surut terhadap paket yang telah dibeli
        sebelumnya.
      </p>

      <h2>8. Hukum yang Berlaku</h2>
      <p>Syarat &amp; Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia.</p>

      <h2>9. Kontak</h2>
      <p>
        Pertanyaan mengenai Syarat &amp; Ketentuan dapat disampaikan melalui
        WhatsApp{" "}
        <a href="https://wa.me/6282117173124" className="text-brand-600 hover:underline">
          +62 821-1717-3124
        </a>{" "}
        atau email{" "}
        <a href="mailto:hello@swimprivatehub.biz.id" className="text-brand-600 hover:underline">
          hello@swimprivatehub.biz.id
        </a>
        .
      </p>
      <p>Alamat: {BUSINESS_ADDRESS}</p>
    </LegalPageLayout>
  );
}
