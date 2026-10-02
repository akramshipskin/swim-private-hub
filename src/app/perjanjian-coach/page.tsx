import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { BUSINESS_ADDRESS } from "@/lib/business";
import { PARTNER_AGREEMENTS } from "@/lib/partner-agreement";

export const metadata: Metadata = {
  title: "Perjanjian Kemitraan Coach | Swim Private Hub",
  description: "Perjanjian kemitraan antara Swim Private Hub dan coach renang mitra, disetujui lewat centang di aplikasi.",
  // Hanya untuk mitra: tidak masuk mesin pencari (juga sudah keluar dari peta situs).
  robots: { index: false, follow: false },
};

// Teks = docs/legal/draft-perjanjian-coach-v1.md (perubahan harga-dari-coach
// v3 disetujui orang hukum 2 Okt) dengan isian [ISI HADI] yang disetujui Hadi
// 2 Okt. Mengubah isi halaman ini = ganti PARTNER_AGREEMENTS.COACH.version
// (src/lib/partner-agreement.ts) supaya semua coach diminta setuju ulang.
const doc = PARTNER_AGREEMENTS.COACH;
const link = "-my-3 inline-block py-3 text-brand-700 hover:underline";

export default function PerjanjianCoachPage() {
  return (
    <LegalPageLayout title={doc.title} updatedAt="2 Oktober 2026">
      {doc.version && <p className="text-xs text-text-subtle">Versi: {doc.version}</p>}
      <p>Perjanjian Kemitraan Coach ini (&ldquo;Perjanjian&rdquo;) berlaku antara:</p>
      <ol>
        <li>
          PT Makna Krabat Indonesia, beralamat di {BUSINESS_ADDRESS}, penyelenggara aplikasi Swim Private Hub
          (&ldquo;SPH&rdquo;); dan
        </li>
        <li>
          pemilik akun coach di aplikasi Swim Private Hub (&ldquo;Aplikasi&rdquo;) yang menyetujui Perjanjian ini,
          dengan identitas sesuai data yang didaftarkan di akunnya (&ldquo;Coach&rdquo;).
        </li>
      </ol>
      <p>
        <strong>Cara persetujuan.</strong> Perjanjian ini disetujui secara elektronik. Coach menyetujuinya dengan
        mencentang persetujuan di Aplikasi, saat mendaftar atau saat Aplikasi memintanya setelah Perjanjian
        diperbarui. Sistem mencatat waktu persetujuan dan versi Perjanjian yang disetujui. Tidak ada penandatanganan
        di atas kertas maupun meterai; persetujuan elektronik tersebut mengikat SPH dan Coach.
      </p>
      <p>
        Istilah Member, Peserta, Sesi, Kolam Mitra, Biaya Layanan, dan Saldo Member dalam Perjanjian ini mengikuti
        definisi dalam{" "}
        <a href="/syarat-ketentuan" className={link}>
          Syarat &amp; Ketentuan
        </a>
        .
      </p>

      <h2>1. Hubungan Para Pihak</h2>
      <ol>
        <li>
          Coach adalah mitra independen yang mengajar les renang privat melalui Aplikasi. Perjanjian ini bukan
          perjanjian kerja.
        </li>
        <li>
          Coach menentukan sendiri jadwal yang dibuka di Aplikasi, per Kolam Mitra tempat Coach dikaitkan oleh SPH.
        </li>
        <li>
          Bergabung sebagai Coach tidak dikenakan biaya pendaftaran maupun langganan. Biaya Layanan SPH dibayar Member
          di atas harga Coach (Pasal 4).
        </li>
      </ol>

      <h2>2. Syarat Coach</h2>
      <ol>
        <li>Akun Coach aktif setelah disetujui SPH.</li>
        <li>
          Sertifikat renang atau lifeguard yang diunggah diperiksa SPH; tanda &ldquo;Bersertifikat&rdquo; hanya tampil
          setelah disetujui.
        </li>
        <li>Coach menjamin data profilnya (nama, umur, keahlian, sertifikat) benar.</li>
        <li>
          Tidak ada persyaratan tambahan untuk mengajar Peserta anak selain persetujuan akun Coach oleh SPH
          sebagaimana butir 1.
        </li>
      </ol>

      <h2>3. Pelaksanaan Sesi</h2>
      <ol>
        <li>Setiap Sesi adalah les privat satu Coach untuk satu Peserta.</li>
        <li>
          Coach wajib hadir tepat waktu dan menandai kehadiran Peserta (Hadir atau Tidak Hadir) di Aplikasi paling
          lambat 24 (dua puluh empat) jam setelah Sesi selesai. Lewat batas itu hanya administrator SPH yang dapat
          menandai, dan Sesi yang belum ditandai tidak menghasilkan bagi hasil sampai ditandai.
        </li>
        <li>
          Bila berhalangan, Coach membatalkan Sesi melalui Aplikasi sedini mungkin. Sesi otomatis kembali ke paket
          Peserta dan Peserta mendapat notifikasi. Jam yang dibatalkan Coach ditutup sehingga tidak dapat dipesan Member lain; Coach dapat
          membukanya kembali melalui menu Jadwal (tombol Tambah Slot).
        </li>
        <li>
          SPH memantau pembatalan oleh Coach. Pembatalan yang sering atau mendadak dapat diberi peringatan, dan bila
          berulang SPH dapat menonaktifkan akun Coach untuk sementara. SPH menilai setiap kasus; pembatalan karena sakit
          atau keadaan darurat tidak dihitung.
        </li>
        <li>
          Coach dilarang menandai Hadir untuk Sesi yang tidak terlaksana, dan dilarang menandai Peserta Tidak Hadir
          bila Peserta sebenarnya hadir atau bila Coach sendiri yang tidak hadir atau tidak mengajar. Pelanggaran:
          bagi hasil Sesi tersebut dibatalkan dan akun Coach dinonaktifkan.
        </li>
        <li>
          Tiket masuk kolam untuk Coach dalam Sesi Aplikasi tidak ditagihkan kepada Coach karena sudah tercakup dalam
          harga Kolam Mitra.
        </li>
        <li>
          <strong>Catatan perkembangan (milestone).</strong> Coach wajib mengisi catatan perkembangan setiap Peserta
          yang diajarnya melalui menu &ldquo;Update milestone&rdquo; di Aplikasi, minimal satu kali untuk setiap 2
          (dua) Sesi yang ditandai Hadir bersama Coach tersebut. Satu catatan terdiri atas catatan tertulis singkat
          dan, bila ada, butir keterampilan yang tercapai atau sedang dilatih; catatan tetap sah walaupun belum ada
          butir baru yang tercapai. Hitungan dilakukan per Coach per Peserta dan hanya untuk Sesi sejak 1 Oktober
          2026. Akibat bila tidak dipenuhi diatur dalam Pasal 5 butir 5. Coach dilarang mencentang butir yang belum
          benar-benar dikuasai Peserta.
        </li>
        <li>
          <strong>Sertifikat level.</strong> Bila seluruh butir satu level tercapai, Aplikasi menerbitkan sertifikat
          level dengan template SPH yang memuat nama dan gambar tanda tangan Coach yang menyelesaikan level itu
          bersama Peserta. Coach mengunggah gambar tanda tangannya sendiri satu kali dan menyetujui penggunaannya
          untuk sertifikat tersebut. Sertifikat level adalah catatan perkembangan belajar di SPH, bukan sertifikasi
          resmi lembaga renang.
        </li>
      </ol>

      <h2>4. Bagi Hasil</h2>
      <ol>
        <li>
          Coach menetapkan sendiri harga jasanya untuk paket 4 Sesi dan paket 8 Sesi melalui Aplikasi. Satu harga
          berlaku di semua Kolam Mitra tempat Coach mengajar. Perubahan harga langsung berlaku untuk pembelian
          berikutnya dan tidak mengubah paket yang sudah dibeli. Coach yang belum memasang harga tidak dapat dipilih
          Member.
        </li>
        <li>
          <strong>Bagian Coach per Sesi</strong> adalah harga Coach dalam paket dibagi jumlah Sesi paket, dibulatkan
          ke bawah ke rupiah penuh. Biaya Layanan SPH ditambahkan di atas harga Coach dan dibayar Member, bukan
          dipotong dari bagian Coach.
        </li>
        <li>
          Untuk setiap Sesi yang ditandai <strong>Hadir</strong>, bagian Coach per Sesi masuk ke saldo Coach di
          Aplikasi setelah dipotong PPh sebagaimana Pasal 5 butir 4. Contoh: harga Coach paket 8 Sesi Rp800.000,
          berarti Rp100.000 per Sesi; PPh 0,5% Rp500; masuk saldo Rp99.500.
        </li>
        <li>
          Sesi yang tidak ditandai Hadir tidak menghasilkan bagi hasil, dengan pengecualian: bila Peserta sudah
          memesan tetapi tidak datang (tanpa membatalkan sesuai Syarat &amp; Ketentuan) dan Coach menandainya Tidak
          Hadir dalam batas waktu, Coach menerima 50% dari bagian Coach yang normal untuk Sesi itu (contoh: bagian
          Coach Rp100.000 menjadi Rp50.000, lalu dipotong PPh). Kolam Mitra menerima Rp0; sisanya menjadi milik SPH.
          Sisa Sesi paket yang hangus karena masa berlaku habis tidak menghasilkan bagi hasil apa pun.
        </li>
        <li>Paket yang diberikan gratis atau manual oleh administrator tidak menghasilkan bagi hasil.</li>
        <li>
          Bila status Hadir dikoreksi menjadi tidak Hadir, bagi hasil Sesi itu dibatalkan. Bila saldo Coach sudah
          tidak mencukupi (misalnya sudah dicairkan), saldo menjadi negatif dan dipotong otomatis dari bagi hasil Sesi
          berikutnya; saldo negatif tidak dapat dicairkan. Bila Perjanjian berakhir saat saldo Coach masih negatif,
          Coach mentransfer kekurangannya ke rekening yang ditunjuk SPH paling lambat 14 (empat belas) hari sejak
          Perjanjian berakhir.
        </li>
        <li>
          Member dapat melaporkan status Tidak Hadir yang tidak sesuai (tombol Laporkan) paling lambat 3 (tiga) hari
          sejak Sesi selesai. SPH memeriksa dan dapat mengoreksi status. Bila terbukti Coach yang tidak hadir atau
          menandai tidak sesuai, bagi hasil Sesi itu dibatalkan dan Pasal 3 butir 5 berlaku.
        </li>
        <li>
          Sesi coba: harga Coach adalah harga Coach paket 4 Sesi dibagi 4. Bagian Coach dihitung seperti Sesi biasa.
        </li>
        <li>
          Member dapat dipindahkan ke Coach lain di Kolam Mitra yang sama atas pengajuan Member yang disetujui SPH.
          Coach sebelumnya diberi tahu, jadwal yang belum berlangsung dibatalkan, dan Sesi yang sudah diajar tetap
          dibayar dengan harga Coach sebelumnya. Coach tidak berhak atas sisa Sesi yang dipindahkan.
        </li>
        <li>
          Untuk Sesi dari paket yang dibeli sebelum 2 Oktober 2026, bagi hasil mengikuti ketentuan lama, yaitu
          persentase bagi hasil yang tercatat untuk Kolam Mitra tempat Sesi diajar pada saat Sesi ditandai, tanpa
          potongan PPh 0,5%.
        </li>
      </ol>

      <h2>5. Pencairan</h2>
      <ol>
        <li>
          Coach mengajukan pencairan melalui Aplikasi, minimal Rp50.000, ke rekening atas nama Coach sendiri.
        </li>
        <li>Saldo dipotong saat pengajuan; pengajuan yang gagal atau ditolak mengembalikan saldo.</li>
        <li>
          SPH memproses transfer secara manual secepatnya, paling lambat 7 (tujuh) hari kerja sejak pengajuan, dan
          mencatat bukti transfer di Aplikasi. Biaya transfer ditanggung SPH.
        </li>
        <li>
          SPH memotong PPh final 0,5% dari bagian Coach setiap Sesi dan menyetorkannya atas nama Coach. Coach yang
          menyerahkan surat pernyataan peredaran bruto di bawah Rp500.000.000 setahun tidak dipotong sejak surat
          diterima SPH. SPH mengirimkan bukti potong setiap bulan, paling lambat tanggal 20 bulan berikutnya.
          Kewajiban perpajakan Coach di luar potongan ini, termasuk kepemilikan NPWP, menjadi tanggung jawab Coach.
        </li>
        <li>
          <strong>Penahanan pencairan.</strong> Selama ada Peserta yang sudah 2 (dua) Sesi Hadir atau lebih bersama
          Coach tanpa catatan perkembangan dari Coach (Pasal 3 butir 7), Coach tidak dapat mengajukan pencairan baru
          atas seluruh saldonya. Saldo tetap menjadi hak Coach dan terus bertambah dari Sesi berikutnya; penahanan
          berakhir otomatis begitu catatan untuk Peserta tersebut diisi. Pengajuan pencairan yang sudah masuk sebelum
          penahanan tetap diproses. Contoh: saldo Rp600.000, Peserta A sudah 2 Sesi Hadir tanpa catatan, maka
          pengajuan pencairan ditolak Aplikasi sampai Coach mengisi catatan Peserta A; setelah itu Rp600.000 dapat
          diajukan seperti biasa.
        </li>
      </ol>

      <h2>6. Larangan Transaksi di Luar Aplikasi</h2>
      <ol>
        <li>
          Selama Perjanjian berlaku dan 12 (dua belas) bulan setelah berakhir, Coach tidak menawarkan atau menerima
          pembayaran les secara langsung dari Member yang dikenalnya melalui Aplikasi.
        </li>
        <li>Coach tidak membagikan nomor kontak pribadinya kepada Member melalui Aplikasi untuk tujuan tersebut.</li>
        <li>
          Murid yang sudah menjadi murid Coach sebelum Coach bergabung dengan SPH boleh didaftarkan ke Aplikasi
          menggunakan kode afiliasi Coach, dengan komisi sesuai Pasal 10. Murid tersebut juga boleh tetap dilayani
          Coach di luar Aplikasi; butir 1 dan 2 tidak berlaku bagi mereka.
        </li>
        <li>
          Akibat pelanggaran: akun Coach dinonaktifkan dan Coach dimasukkan ke daftar hitam SPH sehingga tidak dapat
          bergabung kembali. Larangan ini hanya mengikat Coach dan Kolam Mitra, tidak dibebankan kepada Member.
        </li>
      </ol>

      <h2>7. Keselamatan dan Tanggung Jawab</h2>
      <ol>
        <li>
          Coach bertanggung jawab atas pengajaran dan pengawasan Peserta selama Sesi, termasuk menyesuaikan materi
          dengan kemampuan dan umur Peserta.
        </li>
        <li>
          Bila terjadi insiden selama Sesi, Coach wajib segera melapor kepada SPH dan pihak Kolam Mitra, paling lambat
          1x24 (satu kali dua puluh empat) jam sejak kejadian.
        </li>
        <li>
          Coach bertanggung jawab atas risiko dan perlengkapan keselamatan yang berada di bawah kendalinya selama Sesi,
          sesuai hukum yang berlaku. SPH tidak menyediakan asuransi bagi Coach maupun Peserta; Coach disarankan
          memiliki asuransi kesehatan atau kecelakaan sendiri.
        </li>
        <li>
          SPH adalah penyelenggara platform dan bertanggung jawab atas pemesanan, jadwal, pencatatan, penerimaan
          pembayaran, dan pembagian dana. SPH tidak mengelola fasilitas kolam dan tidak mengajar.
        </li>
        <li>
          Tanggung jawab SPH kepada Coach terbatas pada pembayaran bagian Coach dan komisi afiliasi yang menjadi hak
          Coach sesuai Perjanjian ini. SPH tidak bertanggung jawab atas kerugian tidak langsung, termasuk kehilangan
          pendapatan atau peluang, kecuali timbul karena kesengajaan atau kelalaian berat SPH.
        </li>
      </ol>

      <h2>8. Data Pribadi</h2>
      <ol>
        <li>
          Coach menerima data Peserta sebatas yang diperlukan untuk Sesi (nama Peserta, nama akun Member, umur Peserta, jadwal, kolam).
        </li>
        <li>
          Coach wajib menjaga kerahasiaan data Peserta, termasuk data anak, dan tidak memakainya di luar pelaksanaan
          Sesi.
        </li>
      </ol>

      <h2>9. Jangka Waktu dan Pengakhiran</h2>
      <ol>
        <li>
          Perjanjian berlaku 12 (dua belas) bulan sejak pertama kali disetujui dan diperpanjang otomatis setiap 12
          (dua belas) bulan. Persetujuan atas versi Perjanjian yang diperbarui tidak memulai ulang jangka waktu ini.
        </li>
        <li>
          Pihak yang tidak ingin memperpanjang memberi tahu pihak lainnya secara tertulis paling lambat 30 (tiga
          puluh) hari sebelum masa berlaku berakhir.
        </li>
        <li>
          Salah satu pihak dapat mengakhiri Perjanjian lebih awal dengan pemberitahuan tertulis paling lambat 30
          (tiga puluh) hari sebelumnya. Penonaktifan akun karena pelanggaran mengikuti pasal yang mengatur pelanggaran
          tersebut.
        </li>
        <li>
          Saat Perjanjian berakhir: Sesi terjadwal diselesaikan, atau dibatalkan dengan Sesi dikembalikan ke paket
          Peserta; saldo Coach dicairkan penuh, atau dilunasi Coach bila negatif (Pasal 4 butir 6); akun Coach
          dinonaktifkan.
        </li>
      </ol>

      <h2>10. Komisi Afiliasi</h2>
      <ol>
        <li>SPH memberi Coach satu kode afiliasi singkat yang unik.</li>
        <li>
          Member baru yang saat mendaftar memasukkan kode itu tercatat dibawa oleh Coach. Kode dimasukkan saat
          pendaftaran dan tidak dapat diubah kemudian kecuali oleh administrator SPH. Coach tidak dapat memakai
          kodenya untuk dirinya sendiri.
        </li>
        <li>
          Komisi afiliasi diberikan satu kali per Member baru (bukan komisi tiap Sesi), sebesar 50% dari Biaya Layanan SPH
          setelah dikurangi PPN, pada paket berbayar pertama Member. Sesi coba tidak dihitung sebagai paket pertama.
          Contoh: paket dengan Biaya Layanan Rp83.200 (Rp74.955 setelah PPN 11%) memberi komisi Rp37.477; besarnya
          sama untuk Coach dan Kolam Mitra. Komisi dikreditkan setelah Member menghadiri Sesi pertamanya dari paket
          berbayar (ditandai Hadir) dan lewat masa laporan 3 (tiga) hari, supaya pendaftaran palsu tidak menghasilkan
          uang. Untuk paket yang dibayar sebelum 3 Oktober 2026, komisi tetap 5% dari jumlah yang dibayar Member untuk
          paket pertamanya.
        </li>
        <li>
          Program tidak dibatasi waktu selama Perjanjian berlaku; Coach dapat membawa Member kapan saja. SPH dapat
          mengubah ketentuan afiliasi melalui pembaruan Perjanjian atau Syarat &amp; Ketentuan, berlaku untuk Member
          yang mendaftar setelah perubahan; komisi yang sudah dikreditkan tidak ditarik kembali, kecuali karena
          kecurangan sebagaimana butir 8.
        </li>
        <li>
          Komisi afiliasi dibayar SPH dari bagian SPH, bukan dari Member dan bukan dari bagian Coach atau Kolam Mitra
          lainnya. Harga yang dibayar Member tidak berubah karena kode.
        </li>
        <li>Saldo dari komisi afiliasi dicairkan mengikuti Pasal 5.</li>
        <li>
          Pajak atas komisi afiliasi ditanggung SPH sesuai ketentuan perpajakan yang berlaku; Coach menerima komisi
          penuh tanpa potongan.
        </li>
        <li>
          Pendaftaran fiktif atau kecurangan lain dalam program afiliasi: komisi dibatalkan atau, bila sudah masuk
          saldo, ditarik kembali, dan akun Coach dinonaktifkan.
        </li>
      </ol>

      <h2>11. Perubahan Perjanjian</h2>
      <p>
        SPH dapat memperbarui Perjanjian ini. Versi baru ditampilkan di Aplikasi dan berlaku setelah Coach
        menyetujuinya lewat centang. Sampai versi baru disetujui, Coach diarahkan ke halaman persetujuan dan belum dapat
        memakai menu Coach di Aplikasi.
      </p>

      <h2>12. Hukum dan Penyelesaian Sengketa</h2>
      <p>
        Perjanjian ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan lebih dulu secara musyawarah; bila
        tidak tercapai kesepakatan, sengketa diselesaikan melalui Pengadilan Negeri Cianjur.
      </p>

      <h2>13. Kontak</h2>
      <p>
        WhatsApp{" "}
        <a href="https://wa.me/6282117173124" className={link}>
          +62 821-1717-3124
        </a>{" "}
        atau email{" "}
        <a href="mailto:hello@swimprivatehub.biz.id" className={link}>
          hello@swimprivatehub.biz.id
        </a>
        .
      </p>
      <p>Alamat: {BUSINESS_ADDRESS}</p>
    </LegalPageLayout>
  );
}
