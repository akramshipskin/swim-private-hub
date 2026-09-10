import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Kebijakan Pengembalian | Les Renang Cianjur",
  description: "Ketentuan kapan pembayaran paket les bisa dan tidak bisa dikembalikan (refund).",
};

export default function KebijakanPengembalianPage() {
  return (
    <LegalPageLayout title="Kebijakan Pengembalian" updatedAt="10 September 2026">
      <p>
        Halaman ini menjelaskan ketentuan pengembalian dana (refund) atas
        pembayaran paket les, serta perbedaannya dengan jatah pembatalan
        pemesanan.
      </p>

      <h2>1. Jatah Pembatalan versus Pengembalian Dana</h2>
      <p>
        Setiap paket memiliki jatah pembatalan (cancel) yang digunakan apabila
        Pengguna membatalkan pemesanan sebelum jadwal berlangsung. Hal ini{" "}
        <strong>bukan</strong> merupakan pengembalian dana — sesi tetap tersedia
        pada paket Pengguna untuk dijadwalkan ulang. Pengembalian dana hanya
        berlaku pada kondisi khusus sebagaimana dijelaskan di bawah ini.
      </p>

      <h2>2. Kondisi yang Dapat Diajukan Pengembalian Dana</h2>
      <ul>
        <li>Pembayaran ganda/duplikat untuk paket yang sama akibat kesalahan teknis.</li>
        <li>Sistem mengaktifkan paket yang keliru akibat kesalahan pada pihak kami.</li>
        <li>Dana telah terpotong namun status transaksi gagal/mengalami kesalahan pada sisi gerbang pembayaran (bukan akibat pembatalan oleh pembeli sendiri).</li>
      </ul>

      <h2>3. Kondisi yang Tidak Dapat Diajukan Pengembalian Dana</h2>
      <ul>
        <li>Paket yang sesinya telah digunakan, baik sebagian maupun seluruhnya.</li>
        <li>Pembatalan keikutsertaan setelah paket aktif tanpa sesi yang terpakai, yang diajukan lebih dari 7 (tujuh) hari sejak tanggal pembayaran (dapat dipertimbangkan secara kasus per kasus melalui kontak di bawah).</li>
        <li>Kesalahan input data peserta yang dilakukan oleh pembeli sendiri (dapat dikoreksi melalui administrator, dan bukan merupakan dasar pengajuan pengembalian dana).</li>
      </ul>

      <h2>4. Tata Cara Pengajuan</h2>
      <ol className="list-decimal pl-5">
        <li>Menghubungi kami melalui WhatsApp/email di bawah dengan menyertakan nomor transaksi atau nama akun.</li>
        <li>Tim kami akan memverifikasi status transaksi melalui sistem dan Midtrans.</li>
        <li>Apabila disetujui, dana akan dikembalikan ke metode pembayaran asal paling lambat 14 (empat belas) hari kerja.</li>
      </ol>

      <h2>5. Kontak Pengajuan Pengembalian Dana</h2>
      <p>
        WhatsApp{" "}
        <a href="https://wa.me/6282117173124" className="text-brand-600 hover:underline">
          +62 821-1717-3124
        </a>{" "}
        atau email{" "}
        <a href="mailto:cianjurmarketers@gmail.com" className="text-brand-600 hover:underline">
          cianjurmarketers@gmail.com
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
