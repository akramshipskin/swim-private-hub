import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { BUSINESS_ADDRESS } from "@/lib/business";
import { PARTNER_AGREEMENTS } from "@/lib/partner-agreement";

export const metadata: Metadata = {
  title: "MOU Kolam Mitra | Swim Private Hub",
  description: "Perjanjian kerja sama antara Swim Private Hub dan kolam renang mitra, disetujui lewat centang di aplikasi.",
  // Hanya untuk mitra: tidak masuk mesin pencari (juga sudah keluar dari peta situs).
  robots: { index: false, follow: false },
};

// Teks = docs/legal/draft-mou-kolam-v1.md (perubahan harga-dari-coach v3
// disetujui orang hukum 2 Okt) dengan isian [ISI HADI] yang disetujui Hadi
// 2 Okt. Mengubah isi halaman ini = ganti PARTNER_AGREEMENTS.POOL_OWNER.version
// (src/lib/partner-agreement.ts) supaya semua pemilik kolam diminta setuju ulang.
const doc = PARTNER_AGREEMENTS.POOL_OWNER;
const link = "-my-3 inline-block py-3 text-brand-700 hover:underline";

export default function MouKolamPage() {
  return (
    <LegalPageLayout title={doc.title} updatedAt="2 Oktober 2026">
      {doc.version && <p className="text-xs text-text-subtle">Versi: {doc.version}</p>}
      <p>
        Perjanjian Kerja Sama Kolam Mitra Swim Private Hub ini (&ldquo;MOU&rdquo;) berlaku antara:
      </p>
      <ol>
        <li>
          PT Makna Krabat Indonesia, beralamat di {BUSINESS_ADDRESS}, penyelenggara aplikasi Swim Private Hub
          (&ldquo;SPH&rdquo;); dan
        </li>
        <li>
          pengelola kolam renang yang mendaftarkan kolamnya di aplikasi Swim Private Hub (&ldquo;Aplikasi&rdquo;) dan
          menyetujui MOU ini melalui akun pemilik kolam, dengan nama pengelola, nama kolam, dan alamat kolam sesuai data
          yang tercatat di Aplikasi (&ldquo;Kolam Mitra&rdquo;).
        </li>
      </ol>
      <p>
        <strong>Cara persetujuan.</strong> MOU ini disetujui secara elektronik. Kolam Mitra menyetujuinya dengan
        mencentang persetujuan di Aplikasi, saat mendaftar atau saat Aplikasi memintanya setelah MOU diperbarui.
        Sistem mencatat waktu persetujuan dan versi MOU yang disetujui. Orang yang mencentang atas nama Kolam Mitra
        menyatakan berwenang mewakili pengelola kolam. Tidak ada penandatanganan di atas kertas maupun meterai;
        persetujuan elektronik tersebut mengikat SPH dan Kolam Mitra.
      </p>
      <p>
        Istilah Member, Peserta, Coach, Sesi, Biaya Layanan, dan Saldo Member dalam MOU ini mengikuti definisi
        dalam{" "}
        <a href="/syarat-ketentuan" className={link}>
          Syarat &amp; Ketentuan
        </a>
        .
      </p>

      <h2>1. Ruang Lingkup</h2>
      <ol>
        <li>
          SPH menyelenggarakan Aplikasi untuk pemesanan dan pembayaran les renang privat antara Member, Coach mitra,
          dan Kolam Mitra.
        </li>
        <li>Kolam Mitra menyediakan fasilitas kolam untuk les renang privat yang dipesan melalui Aplikasi.</li>
        <li>
          Les yang dimaksud adalah les privat satuan: satu Coach untuk satu Peserta per Sesi, bukan kelas atau klub
          gabungan.
        </li>
        <li>Les berlangsung pada jam buka Kolam Mitra yang tercatat di Aplikasi.</li>
        <li>
          Kerja sama ini tidak berbayar bagi Kolam Mitra: tidak ada biaya pendaftaran maupun langganan. Biaya Layanan
          SPH dibayar Member di atas harga Kolam Mitra (Pasal 5).
        </li>
        <li>
          SPH tidak menetapkan batas jumlah les yang berjalan bersamaan di Kolam Mitra. Bila kapasitas kolam
          terganggu, Kolam Mitra memberi tahu SPH, dan SPH menyesuaikan jadwal yang tampil di Aplikasi paling lambat
          1x24 (satu kali dua puluh empat) jam sejak pemberitahuan diterima.
        </li>
      </ol>

      <h2>2. Paket dan Harga</h2>
      <ol>
        <li>
          Kolam Mitra menetapkan sendiri harga tiket untuk paket 4 Sesi dan paket 8 Sesi melalui Aplikasi. Perubahan
          langsung berlaku untuk pembelian berikutnya dan tidak mengubah paket yang sudah dibeli.
        </li>
        <li>
          Harga Kolam Mitra per Sesi mencakup tiket masuk untuk 1 (satu) Coach, 1 (satu) Peserta, dan 1 (satu)
          pendamping yang tidak berenang (boleh bergantian). Coach, Peserta, dan pendamping tidak dikenakan tiket lain
          untuk Sesi Aplikasi.
        </li>
      </ol>

      <h2>3. Coach</h2>
      <ol>
        <li>
          Coach yang mengajar di Kolam Mitra adalah Coach yang telah disetujui SPH dan dikaitkan oleh SPH ke Kolam
          Mitra.
        </li>
        <li>
          Kolam Mitra tidak dapat menolak Coach yang telah disetujui SPH dan dikaitkan ke Kolam Mitra. Kolam Mitra
          dapat melaporkan pelanggaran tata tertib atau keselamatan oleh Coach kepada SPH, dan SPH menindaklanjuti
          laporan tersebut paling lambat 3 (tiga) hari kerja sejak laporan diterima.
        </li>
        <li>
          Kolam Mitra boleh mengajukan coach miliknya sendiri untuk mengajar melalui Aplikasi lewat formulir
          pendaftaran coach yang biasa. Coach tersebut aktif setelah disetujui SPH dan terikat Perjanjian Kemitraan
          Coach.
        </li>
      </ol>

      <h2>4. Sifat Kerja Sama dan Larangan Transaksi di Luar Aplikasi</h2>
      <ol>
        <li>
          Kerja sama ini tidak eksklusif atas pengunjung. Kolam Mitra tetap kolam umum yang menerima pengunjung dari
          sumber mana pun, termasuk yang datang melalui SPH, dan tidak dibatasi menerima pengunjung, klub, atau les
          dari pihak lain.
        </li>
        <li>
          Les privat melalui SPH adalah les satu lawan satu antara Coach dan Peserta di kolam umum; bukan penyewaan
          kolam atau lintasan, dan tidak memberi SPH maupun Coach hak menguasai area kolam.
        </li>
        <li>
          Les privat satuan di Kolam Mitra oleh Coach yang terdaftar di Aplikasi kepada Member yang dikenal melalui
          Aplikasi hanya dilaksanakan melalui pemesanan di Aplikasi. Kewajiban ini mengikat Coach melalui Perjanjian
          Kemitraan Coach; Kolam Mitra tidak memfasilitasi transaksi langsung antara Coach mitra SPH dan Member
          tersebut.
        </li>
        <li>
          Kewajiban pada butir 3 berlaku selama MOU berlaku dan 12 (dua belas) bulan setelah berakhir. Akibat
          pelanggaran oleh Kolam Mitra: kerja sama diakhiri, akun Kolam Mitra dinonaktifkan, dan Kolam Mitra
          dimasukkan ke daftar hitam SPH.
        </li>
      </ol>

      <h2>5. Bagi Hasil</h2>
      <ol>
        <li>
          Member membayar paket kepada SPH melalui Midtrans. Kolam Mitra tidak menerima pembayaran langsung dari
          Member untuk Sesi Aplikasi.
        </li>
        <li>
          <strong>Bagian Kolam Mitra per Sesi</strong> adalah harga Kolam Mitra dalam paket dibagi jumlah Sesi paket,
          dibulatkan ke bawah ke rupiah penuh. Biaya Layanan SPH ditambahkan di atas harga dan dibayar Member, bukan
          dipotong dari bagian Kolam Mitra.
        </li>
        <li>
          Untuk setiap Sesi yang ditandai <strong>Hadir</strong>, bagian Kolam Mitra masuk ke saldo Kolam Mitra di
          Aplikasi setelah dipotong PPh sebagaimana butir 12.
        </li>
        <li>
          Contoh: harga Kolam Mitra paket 8 Sesi Rp480.000, berarti Rp60.000 per Sesi; PPh 0,5% Rp300; masuk saldo
          Rp59.700. Bila Peserta tidak datang (butir 5 huruf a): Kolam Mitra Rp0.
        </li>
        <li>
          Sesi yang tidak ditandai Hadir tidak menghasilkan bagi hasil, dengan penegasan berikut:
          <br />
          a. Peserta sudah memesan tetapi tidak datang (tanpa membatalkan sesuai Syarat &amp; Ketentuan): Coach
          menerima 50% dari bagian Coach yang normal, Kolam Mitra menerima Rp0, dan sisanya menjadi milik SPH.
          <br />
          b. Sisa Sesi paket yang hangus karena masa berlaku habis: tidak ada bagi hasil bagi siapa pun.
        </li>
        <li>Paket yang diberikan gratis atau manual oleh administrator tidak menghasilkan bagi hasil.</li>
        <li>
          Bila status Hadir dikoreksi menjadi tidak Hadir, bagi hasil Sesi itu dibatalkan. Bila saldo Kolam Mitra
          sudah tidak mencukupi (misalnya sudah dicairkan), saldo menjadi negatif dan dipotong otomatis dari bagi hasil
          Sesi berikutnya; saldo negatif tidak dapat dicairkan. Bila MOU berakhir saat saldo Kolam Mitra masih
          negatif, Kolam Mitra mentransfer kekurangannya ke rekening yang ditunjuk SPH paling lambat 14 (empat belas)
          hari sejak MOU berakhir.
        </li>
        <li>Harga dapat diubah Kolam Mitra kapan saja melalui Aplikasi sesuai Pasal 2 butir 1.</li>
        <li>
          Coach menandai kehadiran paling lambat 24 (dua puluh empat) jam setelah Sesi selesai; lewat batas itu hanya
          administrator SPH yang dapat menandai, dan Sesi yang belum ditandai tidak menghasilkan bagi hasil sampai
          ditandai.
        </li>
        <li>
          Member dapat melaporkan status Tidak Hadir yang tidak sesuai (tombol Laporkan) paling lambat 3 (tiga) hari
          sejak Sesi selesai. SPH memeriksa dan dapat mengoreksi status; koreksi menjadi Hadir menghasilkan bagi hasil
          normal, dan koreksi sebaliknya mengikuti butir 7.
        </li>
        <li>
          Sesi coba: harga Kolam Mitra adalah harga paket 4 Sesi dibagi 4; bagian Kolam Mitra dihitung seperti Sesi
          biasa.
        </li>
        <li>
          SPH memotong PPh final 0,5% dari bagian Kolam Mitra setiap Sesi dan menyetorkannya atas nama Kolam Mitra.
          Kolam Mitra yang menyerahkan surat pernyataan peredaran bruto di bawah Rp500.000.000 setahun tidak dipotong
          sejak surat diterima SPH. SPH mengirimkan bukti potong setiap bulan, paling lambat tanggal 20 bulan
          berikutnya.
        </li>
        <li>
          Untuk Sesi dari paket yang dibeli sebelum 2 Oktober 2026, bagi hasil mengikuti ketentuan yang berlaku saat
          paket dibeli, yaitu persentase bagi hasil yang tercatat untuk Kolam Mitra tempat Sesi diajar.
        </li>
      </ol>

      <h2>6. Pencairan</h2>
      <ol>
        <li>
          Kolam Mitra dapat mengajukan pencairan saldo melalui Aplikasi, minimal Rp50.000 per pengajuan, ke rekening
          atas nama pengelola Kolam Mitra yang didaftarkan di Aplikasi.
        </li>
        <li>Saldo dipotong saat pengajuan dibuat. Pengajuan yang gagal atau ditolak mengembalikan saldo.</li>
        <li>
          SPH memproses transfer secara manual secepatnya, paling lambat 7 (tujuh) hari kerja sejak pengajuan, dan
          mencatat bukti transfer di Aplikasi.
        </li>
        <li>Biaya transfer ditanggung SPH.</li>
        <li>
          Kolam Mitra dapat melihat riwayat saldo, bagi hasil per Sesi, dan riwayat pencairan di Aplikasi setiap saat.
        </li>
      </ol>

      <h2>7. Pembatalan dan Pengembalian Dana</h2>
      <ol>
        <li>
          Aturan pembatalan oleh Member mengikuti Syarat &amp; Ketentuan: pembatalan mandiri paling lambat 2 (dua) jam
          sebelum jadwal selama jatah pembatalan paket masih tersedia (2 kali untuk paket 4 Sesi, 4 kali untuk paket 8
          Sesi); Sesi coba tidak dapat dibatalkan sendiri oleh Member.
        </li>
        <li>
          Pengembalian dana kepada Member diputuskan SPH sesuai{" "}
          <a href="/kebijakan-pengembalian" className={link}>
            Kebijakan Pengembalian
          </a>
          . Bila dana dikembalikan untuk Sesi yang bagi hasilnya sudah masuk ke saldo Kolam Mitra, bagian Kolam Mitra
          atas Sesi tersebut dipotong dari saldo Kolam Mitra, termasuk dari bagi hasil berikutnya bila saldo saat itu
          tidak mencukupi (Pasal 5 butir 7 berlaku).
        </li>
      </ol>

      <h2>8. Keselamatan dan Tanggung Jawab</h2>
      <ol>
        <li>
          Kolam Mitra bertanggung jawab atas kelayakan dan keselamatan fasilitas selama Sesi. Kolam Mitra menyediakan
          penjaga atau petugas jaga kolam yang cakap dan perlengkapan P3K, serta menyesuaikan kedalaman kolam untuk
          Peserta anak sesuai ketentuan keselamatan yang berlaku.
        </li>
        <li>
          Coach bertanggung jawab atas pengajaran dan pengawasan Peserta selama Sesi (diatur dalam Perjanjian
          Kemitraan Coach).
        </li>
        <li>
          Bila terjadi insiden selama Sesi, Kolam Mitra wajib segera melapor kepada SPH, paling lambat 1x24 (satu kali
          dua puluh empat) jam sejak kejadian. Kolam Mitra bertanggung jawab atas risiko dan perlengkapan keselamatan
          yang berada di bawah kendalinya, sesuai hukum yang berlaku. SPH tidak menyediakan asuransi bagi Kolam Mitra
          maupun Peserta.
        </li>
        <li>
          SPH adalah penyelenggara platform dan bertanggung jawab atas pemesanan, jadwal, pencatatan, penerimaan
          pembayaran, dan pembagian dana. SPH tidak mengelola fasilitas kolam dan tidak mengajar.
        </li>
      </ol>

      <h2>9. Data Pribadi</h2>
      <ol>
        <li>
          Kolam Mitra dapat melihat di Aplikasi: jadwal Sesi di kolamnya, nama Coach, serta nama Peserta, nama akun Member, dan jumlah Peserta.
        </li>
        <li>
          Kolam Mitra wajib menjaga kerahasiaan data tersebut, hanya memakainya untuk pelaksanaan Sesi, dan tidak
          menghubungi Member untuk menawarkan les di luar Aplikasi.
        </li>
      </ol>

      <h2>10. Jangka Waktu dan Pengakhiran</h2>
      <ol>
        <li>
          MOU berlaku 12 (dua belas) bulan sejak disetujui dan diperpanjang otomatis setiap 12 (dua belas) bulan.
        </li>
        <li>
          Pihak yang tidak ingin memperpanjang memberi tahu pihak lainnya secara tertulis paling lambat 30 (tiga
          puluh) hari sebelum masa berlaku berakhir.
        </li>
        <li>
          Salah satu pihak dapat mengakhiri MOU lebih awal dengan pemberitahuan tertulis paling lambat 30 (tiga
          puluh) hari sebelumnya. Pengakhiran karena pelanggaran mengikuti pasal yang mengatur pelanggaran tersebut.
        </li>
        <li>
          Saat MOU berakhir: Kolam Mitra tidak lagi dapat dipilih untuk pembelian paket baru; Sesi dari paket yang
          sudah dibeli Member tetap dijalankan sampai paket tersebut habis atau masa berlakunya berakhir; setelah itu
          kolam dinonaktifkan di Aplikasi, dan saldo Kolam Mitra dicairkan penuh atau dilunasi Kolam Mitra bila
          negatif (Pasal 5 butir 7).
        </li>
      </ol>

      <h2>11. Komisi Afiliasi</h2>
      <ol>
        <li>SPH memberi Kolam Mitra satu kode afiliasi singkat yang unik.</li>
        <li>
          Member baru yang saat mendaftar memasukkan kode itu tercatat dibawa oleh Kolam Mitra. Kode dimasukkan saat
          pendaftaran dan tidak dapat diubah kemudian kecuali oleh administrator SPH. Kolam Mitra tidak dapat memakai
          kodenya untuk dirinya sendiri.
        </li>
        <li>
          Komisi afiliasi diberikan satu kali per Member baru (bukan komisi tiap Sesi), sebesar 5% dari jumlah yang
          dibayar Member untuk paket pertamanya (contoh: Member membayar paket pertama Rp1.363.200, komisi Rp68.160;
          besarnya sama untuk Coach dan Kolam Mitra). Komisi dikreditkan setelah Member menghadiri Sesi pertamanya
          (ditandai Hadir) dan lewat masa laporan 3 (tiga) hari, supaya pendaftaran palsu tidak menghasilkan uang.
          Sesi coba juga dihitung sebagai paket pertama.
        </li>
        <li>
          Program tidak dibatasi waktu selama MOU berlaku. SPH dapat mengubah ketentuan afiliasi melalui pembaruan MOU
          atau Syarat &amp; Ketentuan, berlaku untuk Member yang mendaftar setelah perubahan; komisi yang sudah
          dikreditkan tidak ditarik kembali, kecuali karena kecurangan sebagaimana butir 8.
        </li>
        <li>
          Komisi afiliasi dibayar SPH dari bagian SPH, bukan dari Member dan bukan dari bagian Coach atau bagian Kolam
          Mitra lainnya. Harga yang dibayar Member tidak berubah karena kode.
        </li>
        <li>Saldo dari komisi afiliasi dicairkan mengikuti Pasal 6.</li>
        <li>
          Pajak atas komisi afiliasi ditanggung SPH sesuai ketentuan perpajakan yang berlaku; Kolam Mitra menerima
          komisi penuh tanpa potongan.
        </li>
        <li>
          Pendaftaran fiktif atau kecurangan lain dalam program afiliasi: komisi dibatalkan atau, bila sudah masuk
          saldo, ditarik kembali, dan akun Kolam Mitra dinonaktifkan.
        </li>
      </ol>

      <h2>12. Perubahan MOU</h2>
      <p>
        SPH dapat memperbarui MOU ini. Versi baru ditampilkan di Aplikasi dan berlaku setelah Kolam Mitra
        menyetujuinya lewat centang. Sampai versi baru disetujui, akun Kolam Mitra diarahkan ke halaman persetujuan dan
        belum dapat memakai menu kolam di Aplikasi.
      </p>

      <h2>13. Hukum dan Penyelesaian Sengketa</h2>
      <p>
        MOU ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan lebih dulu secara musyawarah; bila tidak
        tercapai kesepakatan, sengketa diselesaikan melalui Pengadilan Negeri Cianjur.
      </p>

      <h2>14. Kontak</h2>
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
