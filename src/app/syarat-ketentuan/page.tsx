import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { TERMS_UPDATED_AT } from "@/lib/legal";
import { BUSINESS_ADDRESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | Swim Private Hub",
  description: "Ketentuan penggunaan platform les renang privat Swim Private Hub.",
};

// Teks = docs/legal/draft-syarat-ketentuan-v2.md yang disetujui reviewer
// hukum (29 Sep), dengan isian Hadi, ditambah perubahan "harga dari coach"
// docs/legal/draft-harga-dari-coach-v3.md (disetujui orang hukum 2 Okt).
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
        jadwal yang dipesan. &ldquo;Biaya Layanan&rdquo; adalah biaya platform SPH yang ditambahkan di atas harga
        Coach dan harga Kolam Mitra dan ditampilkan terpisah saat pembelian. &ldquo;Saldo Member&rdquo; adalah nilai
        dalam Aplikasi milik Member yang hanya dapat dipakai sesuai Pasal 4 butir 5.
      </p>
      <p>
        <strong>Peran SPH.</strong> SPH menyelenggarakan platform yang mempertemukan Member dengan Coach dan Kolam
        Mitra. Harga jasa mengajar ditetapkan oleh masing-masing Coach dan harga tiket kolam ditetapkan oleh
        masing-masing Kolam Mitra; SPH menambahkan Biaya Layanan. SPH menerima pembayaran dari Member atas nama Coach
        dan Kolam Mitra dan meneruskan bagian mereka setelah Sesi terlaksana. Pengajaran renang dilakukan oleh Coach
        di fasilitas Kolam Mitra.
      </p>

      <h2>1. Akun</h2>
      <ol>
        <li>Pengguna wajib mengisi data pendaftaran (nama, nomor telepon, kata sandi) dengan benar.</li>
        <li>
          Satu akun Member dapat memiliki beberapa Peserta (diri sendiri dan/atau anak). Member yang mendaftarkan
          anak menyatakan dirinya orang tua/wali yang berwenang.
        </li>
        <li>Pengguna bertanggung jawab atas kerahasiaan kata sandi dan tidak boleh meminjamkan akunnya kepada orang lain.</li>
        <li>
          Saat mendaftar, Pengguna dapat memasukkan kode afiliasi milik Coach atau Kolam Mitra (opsional). Kode tidak
          mengubah harga yang dibayar Member; komisi afiliasi dibayarkan SPH kepada pemilik kode dari bagian SPH, bukan
          dari Member. Ketentuan komisi bagi Coach dan Kolam Mitra diatur dalam perjanjian kemitraan masing-masing.
        </li>
      </ol>

      <h2>2. Paket dan Sesi</h2>
      <ol>
        <li>Les di SPH adalah les privat: setiap Sesi adalah satu Coach untuk satu Peserta, bukan kelas gabungan.</li>
        <li>
          Paket terdiri atas 4 (empat) Sesi dengan masa berlaku 60 (enam puluh) hari atau 8 (delapan) Sesi dengan
          masa berlaku 90 (sembilan puluh) hari, dihitung sejak pembayaran berhasil. Paket berlaku untuk satu Coach dan
          satu Kolam Mitra yang dipilih saat pembelian.
        </li>
        <li>
          Harga paket terdiri atas harga Kolam Mitra, harga Coach, dan Biaya Layanan, yang ditampilkan terpisah sebelum
          pembayaran. Harga per Sesi adalah harga paket dibagi jumlah Sesi. Coach dan Kolam Mitra dapat mengubah
          harganya sewaktu-waktu; perubahan tidak berlaku bagi paket yang sudah dibeli.
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
          Harga Kolam Mitra dalam paket sudah mencakup tiket masuk kolam untuk Peserta, Coach, dan 1 (satu)
          pendamping yang tidak berenang (boleh bergantian) pada setiap Sesi. Perlengkapan renang (misalnya pelampung
          dan papan) dibawa sendiri oleh Peserta.
        </li>
        <li>
          Sesi coba: paket 1 (satu) Sesi, satu kali per Peserta yang belum pernah memiliki paket. Harganya sama dengan
          harga per Sesi paket 4 Sesi (Kolam Mitra dan Coach yang dipilih) ditambah Biaya Layanan. Sesi coba berlaku 7
          (tujuh) hari sejak pembayaran berhasil, tidak dapat dibatalkan sendiri oleh Member, dan hangus bila Peserta
          tidak hadir, kecuali administrator mengabulkan permohonan Member melalui kontak di Aplikasi.
        </li>
        <li>
          Paket yang dibeli sebelum 2 Oktober 2026 tetap mengikuti ketentuan yang berlaku saat pembelian sampai paket
          tersebut habis atau berakhir.
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
          Member dapat membatalkan sendiri paling lambat 2 (dua) jam sebelum jadwal selama jatah pembatalan masih
          tersedia: 2 (dua) kali untuk paket 4 Sesi dan 4 (empat) kali untuk paket 8 Sesi. Sesi kembali ke paket dan
          jatah pembatalan berkurang satu. Sesi coba tidak memiliki jatah pembatalan. Di luar ketentuan itu,
          pembatalan hanya melalui administrator.
        </li>
        <li>
          Pemesanan hanya dapat dilakukan pada jadwal Coach paket di Kolam Mitra paket. Apabila Coach berhalangan,
          Coach atau administrator membatalkan jadwal dan Sesi kembali ke paket untuk dijadwalkan ulang.
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
        <li>
          Member dapat mengajukan penggantian Coach untuk sisa Sesi paket melalui Aplikasi dengan menyebutkan alasan.
          Penggantian hanya ke Coach lain yang mengajar di Kolam Mitra yang sama dan memasang harga untuk ukuran paket
          tersebut, dan berlaku setelah disetujui administrator; Coach sebelumnya diberi tahu. Sisa Sesi dihitung ulang
          dengan harga Coach baru beserta Biaya Layanannya: (a) bila lebih murah, selisihnya masuk ke Saldo Member;
          (b) bila lebih mahal, Member membayar selisihnya paling lambat 24 (dua puluh empat) jam sejak disetujui, dan
          bila tidak dibayar, pengajuan batal dan paket tetap dengan Coach sebelumnya. Jadwal dengan Coach sebelumnya
          yang belum berlangsung dibatalkan dan Sesinya kembali ke paket untuk dijadwalkan ulang dengan Coach baru.
          Sesi yang sudah berlangsung tidak dihitung ulang. Bila penggantian tidak dapat diselesaikan setelah selisih
          dibayar (misalnya Coach baru tidak lagi aktif atau paket berakhir), pembayaran selisih dikembalikan ke Saldo
          Member.
        </li>
      </ol>

      <h2>4. Pembayaran</h2>
      <ol>
        <li>
          Pembayaran diproses melalui Midtrans (virtual account, QRIS, dompet digital, dan metode lain yang
          ditampilkan saat pembayaran; kartu kredit tidak diterima) dan diterima oleh penyelenggara SPH. Member tidak
          dikenakan biaya tambahan atas metode pembayaran. Pembayaran yang tidak diselesaikan dalam batas waktu
          Midtrans dianggap batal.
        </li>
        <li>
          Bagian Coach dan Kolam Mitra dibayarkan oleh SPH berdasarkan perjanjian kemitraan masing-masing, setelah
          Sesi ditandai Hadir. Member tidak melakukan pembayaran langsung kepada Coach atau Kolam Mitra untuk Sesi yang
          dipesan melalui Aplikasi.
        </li>
        <li>
          Pengembalian dana diatur dalam{" "}
          <a href="/kebijakan-pengembalian" className="-my-3 inline-block py-3 text-brand-700 hover:underline">
            Kebijakan Pengembalian
          </a>
          .
        </li>
        <li>
          Atas bagian Coach dan Kolam Mitra, SPH memotong dan menyetorkan pajak penghasilan sesuai ketentuan
          perpajakan yang berlaku. Potongan ini tidak mengubah harga yang dibayar Member.
        </li>
        <li>
          Saldo Member: (a) bertambah dari selisih penggantian Coach (Pasal 3) dan dari pengembalian sebagaimana diatur
          dalam Kebijakan Pengembalian; (b) otomatis dipakai lebih dulu saat Member membeli paket atau membayar selisih
          penggantian Coach, dan kekurangannya dibayar melalui Midtrans; (c) tidak dapat dicairkan, ditukar dengan
          uang, atau dipindahkan ke akun lain; (d) bila pembayaran yang memakai Saldo Member gagal atau kedaluwarsa,
          Saldo Member yang terpakai dikembalikan; (e) bila Member mengajukan penghapusan akun, Saldo Member yang masih
          ada dapat dipakai dengan bantuan administrator sampai habis sebelum akun ditutup.
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
          paling banyak sebesar 100% (seratus persen) nilai paket yang dibayarkan Member untuk paket yang bersangkutan,
          termasuk Saldo Member yang dipakai untuk paket tersebut.
        </li>
        <li>
          Keselamatan dan penanganan insiden selama Sesi berada dalam tanggung jawab Coach dan Kolam Mitra sesuai
          perannya; SPH adalah penyedia platform dan tidak mengajar maupun mengelola fasilitas kolam. SPH tidak
          menyediakan asuransi bagi Peserta; Peserta disarankan memiliki asuransi kesehatan atau kecelakaan sendiri.
        </li>
      </ol>

      <h2>7. Perubahan Layanan</h2>
      <p>
        Fitur dan ketentuan ini dapat berubah. Perubahan ketentuan diumumkan melalui Aplikasi dan berlaku sejak
        diumumkan; Pengguna yang tetap menggunakan Aplikasi setelah itu dianggap menyetujui versi baru. Perubahan
        harga oleh Coach, Kolam Mitra, atau perubahan Biaya Layanan tidak berlaku surut terhadap paket yang telah
        dibeli.
      </p>

      <h2>8. Hukum yang Berlaku</h2>
      <p>
        Syarat &amp; Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan yang timbul diselesaikan
        secara musyawarah kekeluargaan.
      </p>

      <h2>9. Kontak</h2>
      <p>
        WhatsApp{" "}
        <a href="https://wa.me/6282117173124" className="-my-3 inline-block py-3 text-brand-700 hover:underline">
          +62 821-1717-3124
        </a>{" "}
        atau email{" "}
        <a href="mailto:hello@swimprivatehub.biz.id" className="-my-3 inline-block py-3 text-brand-700 hover:underline">
          hello@swimprivatehub.biz.id
        </a>
        .
      </p>
      <p>Alamat: {BUSINESS_ADDRESS}</p>
    </LegalPageLayout>
  );
}
