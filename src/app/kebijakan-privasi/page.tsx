import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { PRIVACY_UPDATED_AT } from "@/lib/legal";
import { BUSINESS_ADDRESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Swim Private Hub",
  description: "Data pribadi apa yang dikumpulkan, tujuan penggunaannya, dan hak Anda atas data tersebut.",
};

export default function KebijakanPrivasiPage() {
  return (
    <LegalPageLayout title="Kebijakan Privasi" updatedAt={PRIVACY_UPDATED_AT}>
      <p>
        Kebijakan Privasi ini menjelaskan jenis data pribadi yang dikumpulkan oleh
        Swim Private Hub (&ldquo;kami&rdquo;) melalui aplikasi pemesanan dan manajemen les
        renang (&ldquo;Aplikasi&rdquo;), tujuan penggunaannya, serta hak Pengguna atas data
        tersebut. Kebijakan ini berlaku bagi seluruh Pengguna Aplikasi, yaitu
        orang tua/member, pelatih (coach), pemilik kolam, dan administrator.
      </p>

      <h2>1. Data yang Dikumpulkan</h2>
      <ul>
        <li>Nama, nomor telepon, dan alamat email (email bersifat opsional) pada saat pendaftaran akun.</li>
        <li>Nama anak/peserta les yang didaftarkan di bawah akun member.</li>
        <li>Riwayat pemesanan jadwal, kehadiran, dan sisa sesi paket.</li>
        <li>
          Data transaksi pembayaran (nominal, status, dan metode pembayaran). Nomor
          kartu atau rekening yang dipakai member untuk membayar tidak pernah disimpan
          dalam sistem kami, melainkan diproses langsung oleh Midtrans selaku penyedia
          gerbang pembayaran resmi.
        </li>
        <li>
          Untuk pelatih dan pemilik kolam: nama bank, nomor rekening, dan nama pemilik
          rekening yang diisi sendiri sebagai tujuan pencairan saldo, beserta riwayat
          saldo dan pencairannya.
        </li>
        <li>Alamat IP saat pendaftaran akun dan saat percobaan masuk, untuk keamanan dan pencegahan penyalahgunaan.</li>
        <li>Waktu dan versi persetujuan atas Syarat &amp; Ketentuan serta Kebijakan Privasi saat mendaftar.</li>
        <li>Isi percakapan pada fitur chat bantuan (lihat bagian 4).</li>
        <li>Foto profil dan file sertifikat yang diunggah pelatih, serta foto kolam yang diunggah pemilik kolam.</li>
        <li>Sumber rujukan pendaftaran (misalnya tautan WhatsApp/Instagram) untuk kebutuhan internal, dan tidak dibagikan kepada pihak ketiga untuk tujuan komersial.</li>
      </ul>

      <h2>2. Tujuan Penggunaan Data</h2>
      <ul>
        <li>Mengelola pemesanan jadwal, penugasan pelatih, dan sisa sesi paket Pengguna.</li>
        <li>Memproses pembayaran dan mengaktifkan paket secara otomatis.</li>
        <li>Menghitung komisi kolam dan pelatih per sesi serta memproses pencairan saldo ke rekening tujuan.</li>
        <li>Mengirimkan notifikasi terkait pemesanan (apabila fitur ini diaktifkan oleh Pengguna).</li>
        <li>Melakukan analisis penggunaan Aplikasi secara agregat untuk kepentingan pengembangan layanan.</li>
      </ul>

      <h2>3. Pembagian Data kepada Pihak Ketiga</h2>
      <p>
        Kami hanya membagikan data sebatas yang diperlukan kepada pihak yang
        mendukung penyelenggaraan layanan ini:
      </p>
      <ul>
        <li>
          <strong>Midtrans</strong> — penyedia gerbang pembayaran resmi, menerima
          data transaksi (nominal, nomor pesanan, nama, dan email) untuk memproses
          pembayaran.
        </li>
        <li>
          <strong>Vercel Analytics</strong> — layanan analitik kunjungan halaman
          yang bersifat <em>cookieless</em> dan tidak melacak individu pengguna.
        </li>
        <li>
          <strong>Supabase</strong> — penyedia basis data dan penyimpanan file
          (foto dan sertifikat) tempat data Aplikasi disimpan.
        </li>
        <li>
          <strong>Google (Gemini) dan Anthropic (Claude)</strong> — penyedia
          kecerdasan buatan yang membantu menjawab chat bantuan. Keduanya menerima
          isi pesan chat, riwayat singkat percakapan, serta nama dan peran akun
          Pengguna, hanya untuk menyusun jawaban.
        </li>
        <li>
          <strong>Resend</strong> — layanan pengiriman dan penerimaan email untuk
          korespondensi antara Pengguna dan kami.
        </li>
        <li>
          <strong>Layanan notifikasi peramban</strong> (misalnya Google, Apple,
          Mozilla) — meneruskan isi notifikasi ke perangkat Pengguna, bila fitur
          notifikasi diaktifkan.
        </li>
      </ul>
      <p>Kami tidak menjual maupun menyewakan data pribadi Pengguna kepada pihak manapun.</p>

      <h2>4. Chat Bantuan dan Masa Penyimpanan</h2>
      <p>
        Pesan pada fitur chat bantuan dijawab oleh asisten berbasis kecerdasan
        buatan dan, bila perlu, oleh administrator. Riwayat chat yang tampil bagi
        Pengguna adalah 90 hari terakhir. Arsip percakapan tetap kami simpan untuk
        keperluan penanganan keluhan dan penyelesaian masalah, dan hanya dapat
        diakses administrator. Mohon tidak mengirim kata sandi, nomor kartu, atau
        data sensitif lain melalui chat.
      </p>

      <h2>5. Cookie dan Penyimpanan Lokal</h2>
      <p>
        Aplikasi menggunakan sesi masuk (cookie) serta penyimpanan lokal/sesi
        peramban untuk mendukung fungsi tertentu, termasuk preferensi tampilan.
        Penjelasan lebih lanjut tersedia pada{" "}
        <a href="/kebijakan-cookie" className="text-brand-600 hover:underline">
          Kebijakan Cookie
        </a>
        .
      </p>

      <h2>6. Keamanan Data</h2>
      <p>
        Kata sandi disimpan dalam bentuk terenkripsi (hash), bukan sebagai teks
        biasa. Percobaan masuk yang salah berulang kali akan dikunci sementara,
        dan akun administrator dilindungi verifikasi dua langkah. Akses terhadap
        data dibatasi sesuai peran pengguna — member hanya dapat mengakses data
        anaknya sendiri, pelatih hanya dapat mengakses jadwalnya sendiri, dan
        seterusnya.
      </p>

      <h2>7. Hak Pengguna atas Data Pribadi</h2>
      <p>
        Sesuai dengan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data
        Pribadi, Pengguna berhak untuk:
      </p>
      <ul>
        <li>Memperoleh salinan data pribadi yang kami simpan.</li>
        <li>Meminta perbaikan atas data yang tidak akurat.</li>
        <li>
          Meminta penghapusan akun melalui menu Profil (member) atau kontak di
          bawah. Setelah disetujui administrator, nama, nomor telepon, email, dan
          nama peserta dihapus dari akun. Riwayat transaksi dan arsip percakapan
          tetap disimpan tanpa identitas tersebut, sesuai ketentuan
          perundang-undangan dan keperluan penyelesaian masalah.
        </li>
        <li>Menarik persetujuan atas penggunaan data untuk tujuan yang bersifat non-esensial (misalnya notifikasi).</li>
      </ul>
      <p>Untuk menggunakan hak-hak tersebut, Pengguna dapat menghubungi kami melalui kontak di bawah ini.</p>

      <h2>8. Perubahan Kebijakan</h2>
      <p>
        Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan yang bersifat
        signifikan akan diinformasikan melalui Aplikasi.
      </p>

      <h2>9. Kontak</h2>
      <p>
        Pertanyaan mengenai privasi atau data pribadi dapat disampaikan melalui
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
