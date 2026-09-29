import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { TERMS_UPDATED_AT } from "@/lib/legal";
import { BUSINESS_ADDRESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | Swim Private Hub",
  description: "Ketentuan penggunaan platform les renang privat Swim Private Hub.",
};

// Teks = docs/legal/draft-syarat-ketentuan-v2.md yang disetujui reviewer
// hukum (29 Sep), dengan isian Hadi. Pasal afiliasi (1.4) dan paket trial
// (2.9) sengaja BELUM dipasang: fiturnya belum dibangun (Batch 4).
export default function SyaratKetentuanPage() {
  return (
    <LegalPageLayout title="Syarat & Ketentuan" updatedAt={TERMS_UPDATED_AT}>
      <p>
        Swim Private Hub (&ldquo;SPH&rdquo;, &ldquo;kami&rdquo;) diselenggarakan oleh PT Makna Krabat Indonesia yang
        beralamat di {BUSINESS_ADDRESS}. Dengan mendaftar dan menggunakan aplikasi Swim Private Hub
        (&ldquo;Aplikasi&rdquo;), Pengguna menyatakan telah membaca dan menyetujui Syarat &amp; Ketentuan ini.
      </p>
      <p>
        <strong>Definisi.</strong> &ldquo;Member&rdquo; adalah pengguna yang membeli paket les untuk dirinya dan/atau
        peserta yang didaftarkannya. &ldquo;Peserta&rdquo; adalah orang yang mengikuti les (Member sendiri atau
        anak/tanggungannya). &ldquo;Coach&rdquo; adalah pelatih renang mitra SPH. &ldquo;Kolam Mitra&rdquo; adalah
        pengelola kolam renang yang bekerja sama dengan SPH. &ldquo;Sesi&rdquo; adalah satu pertemuan les pada
        jadwal yang dipesan.
      </p>
      <p>
        <strong>Peran SPH.</strong> SPH menyelenggarakan platform yang mempertemukan Member dengan Coach dan Kolam
        Mitra, menerima pembayaran paket dari Member, dan membagikan bagian Coach dan Kolam Mitra setelah Sesi
        terlaksana. Pengajaran renang dilakukan oleh Coach di fasilitas Kolam Mitra.
      </p>

      <h2>1. Akun</h2>
      <ol>
        <li>Pengguna wajib mengisi data pendaftaran (nama, nomor telepon, kata sandi) dengan benar.</li>
        <li>
          Satu akun Member dapat memiliki beberapa Peserta (diri sendiri dan/atau anak). Member yang mendaftarkan
          anak menyatakan dirinya orang tua/wali yang berwenang.
        </li>
        <li>Pengguna bertanggung jawab atas kerahasiaan kata sandi dan tidak boleh meminjamkan akunnya kepada orang lain.</li>
      </ol>

      <h2>2. Paket dan Sesi</h2>
      <ol>
        <li>Les di SPH adalah les privat: setiap Sesi adalah satu Coach untuk satu Peserta, bukan kelas gabungan.</li>
        <li>Paket terdiri atas sejumlah Sesi dan berlaku di kolam tempat paket dibeli, selama masa berlaku yang tertera saat pembelian.</li>
        <li>
          Member yang masih memiliki paket aktif dapat membeli paket 1 Sesi di Kolam Mitra lain dengan harga khusus
          1 Sesi yang tertera saat pembelian, berlaku 14 hari sejak pembayaran berhasil.
        </li>
        <li>Paket aktif otomatis setelah pembayaran berhasil dikonfirmasi sistem.</li>
        <li>
          Sisa Sesi dan jatah pembatalan berlaku per Peserta dan tidak dapat dipindahkan ke Peserta lain kecuali
          melalui administrator.
        </li>
        <li>Durasi satu Sesi: 60 (enam puluh) menit.</li>
        <li>
          Sisa Sesi yang tidak dipakai sampai masa berlaku paket berakhir dinyatakan hangus dan tidak dapat
          dikembalikan dalam bentuk uang.
        </li>
        <li>
          Harga paket sudah termasuk tiket masuk kolam untuk Peserta. Pendamping yang tidak berenang (1 orang pada
          satu waktu, boleh bergantian) tidak dikenakan tiket. Perlengkapan renang (misalnya pelampung dan papan)
          dibawa sendiri oleh Peserta.
        </li>
        <li>
          Coach mencatat perkembangan Peserta (milestone) di Aplikasi dan Member dapat melihatnya di menu Peserta.
          Catatan melekat pada Peserta dan tetap berlanjut bila Peserta berganti Coach. Sertifikat level yang
          diterbitkan Aplikasi adalah catatan perkembangan belajar di SPH, bukan sertifikasi resmi lembaga renang
          mana pun. Kelompok milestone ditentukan dari tanggal lahir Peserta, sehingga Member wajib mengisinya dengan
          benar.
        </li>
      </ol>

      <h2>3. Pemesanan dan Pembatalan</h2>
      <ol>
        <li>Pemesanan tunduk pada ketersediaan jadwal Coach di kolam yang dipilih. Satu jadwal hanya dapat dipesan oleh satu Peserta.</li>
        <li>Setiap pemesanan mengurangi satu Sesi dari paket.</li>
        <li>
          Member dapat membatalkan sendiri paling lambat 2 (dua) jam sebelum jadwal selama jatah pembatalan paket
          masih tersedia; Sesi kembali ke paket dan jatah pembatalan berkurang satu. Di luar ketentuan itu,
          pembatalan hanya melalui administrator.
        </li>
        <li>Peserta yang tidak hadir tanpa membatalkan sesuai butir 3: Sesi tetap dihitung terpakai.</li>
        <li>Apabila Coach atau administrator membatalkan jadwal, Sesi kembali ke paket tanpa mengurangi jatah pembatalan Member.</li>
        <li>
          Kehadiran ditandai oleh Coach paling lambat 24 jam setelah Sesi selesai; setelah batas itu hanya
          administrator yang dapat menandai.
        </li>
        <li>
          Member dapat melaporkan status Tidak Hadir yang tidak sesuai melalui tombol Laporkan di Aplikasi paling
          lambat 3 (tiga) hari sejak Sesi selesai. SPH memeriksa laporan dan dapat mengoreksi status. Laporan yang
          masuk setelah batas itu diperiksa kasus per kasus oleh administrator.
        </li>
      </ol>

      <h2>4. Pembayaran</h2>
      <ol>
        <li>
          Pembayaran diproses melalui Midtrans (virtual account, QRIS, dompet digital, kartu debit/kredit) dan
          diterima oleh penyelenggara SPH.
        </li>
        <li>
          Bagian Coach dan Kolam Mitra dibayarkan oleh SPH berdasarkan perjanjian kemitraan masing-masing, setelah
          Sesi ditandai Hadir. Member tidak melakukan pembayaran langsung kepada Coach atau Kolam Mitra untuk Sesi yang
          dipesan melalui Aplikasi.
        </li>
        <li>
          Pengembalian dana diatur dalam{" "}
          <a href="/kebijakan-pengembalian" className="text-brand-700 hover:underline">
            Kebijakan Pengembalian
          </a>
          .
        </li>
      </ol>

      <h2>5. Kewajiban Pengguna</h2>
      <ol>
        <li>Menggunakan Aplikasi hanya untuk pemesanan les renang yang sah.</li>
        <li>Tidak menyalahgunakan sistem, termasuk pemesanan ganda dengan itikad tidak baik atau manipulasi data.</li>
        <li>Data Peserta wajib akurat; kesalahan data menjadi tanggung jawab Member yang mendaftarkan.</li>
      </ol>

      <h2>6. Tanggung Jawab</h2>
      <ol>
        <li>Coach bertanggung jawab atas pelaksanaan dan kualitas pengajaran.</li>
        <li>
          Kolam Mitra bertanggung jawab atas kelayakan, kebersihan, dan keselamatan fasilitas kolam, termasuk
          ketersediaan petugas penyelamat (lifeguard) selama jam operasional, perlengkapan dan petugas pertolongan
          pertama (P3K), rambu kedalaman air, kebersihan dan kualitas air, serta keamanan lantai dan area sekitar
          kolam.
        </li>
        <li>
          Member/orang tua/wali bertanggung jawab atas pengawasan Peserta anak di luar waktu Sesi dan atas kondisi
          kesehatan Peserta yang diketahuinya.
        </li>
        <li>
          SPH bertanggung jawab atas pemesanan, jadwal, pencatatan, penerimaan pembayaran, dan pembagian dana sesuai
          Syarat &amp; Ketentuan ini. Tanggung jawab SPH atas kerugian yang timbul dari penggunaan Aplikasi dibatasi
          paling banyak 50% (lima puluh persen) dari nilai paket yang dibayarkan Member untuk paket yang bersangkutan.
        </li>
        <li>
          Keselamatan dan penanganan insiden selama Sesi berada dalam tanggung jawab Coach dan Kolam Mitra sesuai
          perannya; SPH adalah penyedia platform dan tidak mengajar maupun mengelola fasilitas kolam. SPH tidak
          menyediakan asuransi bagi Peserta; Peserta disarankan memiliki asuransi kesehatan atau kecelakaan sendiri.
        </li>
      </ol>

      <h2>7. Perubahan Layanan</h2>
      <p>
        Fitur, harga paket, dan ketentuan ini dapat berubah. Perubahan ketentuan diumumkan melalui Aplikasi dan
        berlaku sejak diumumkan; Pengguna yang tetap menggunakan Aplikasi setelah itu dianggap menyetujui versi baru.
        Perubahan harga tidak berlaku surut terhadap paket yang telah dibeli.
      </p>

      <h2>8. Hukum yang Berlaku</h2>
      <p>
        Syarat &amp; Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan yang timbul diselesaikan
        secara musyawarah kekeluargaan.
      </p>

      <h2>9. Kontak</h2>
      <p>
        WhatsApp{" "}
        <a href="https://wa.me/6282117173124" className="text-brand-700 hover:underline">
          +62 821-1717-3124
        </a>{" "}
        atau email{" "}
        <a href="mailto:hello@swimprivatehub.biz.id" className="text-brand-700 hover:underline">
          hello@swimprivatehub.biz.id
        </a>
        .
      </p>
      <p>Alamat: {BUSINESS_ADDRESS}</p>
    </LegalPageLayout>
  );
}
