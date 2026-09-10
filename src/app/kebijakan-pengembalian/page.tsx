import { LegalPageLayout } from "@/components/legal-page-layout";

export default function KebijakanPengembalianPage() {
  return (
    <LegalPageLayout title="Kebijakan Pengembalian" updatedAt="10 September 2026">
      <p>
        Halaman ini menjelaskan kapan pembayaran paket les bisa dikembalikan
        (refund), dan bedanya sama jatah pembatalan booking (yang gak sama dengan
        pengembalian uang).
      </p>

      <h2>Jatah Pembatalan vs Refund Uang</h2>
      <p>
        Tiap paket punya jatah pembatalan (cancel) yang dipakai kalau kamu batalin
        booking sebelum jadwal. Ini <strong>bukan</strong> pengembalian uang --
        sesi tetap ada di paketmu buat dijadwalkan ulang. Refund uang cuma berlaku
        di kondisi khusus di bawah.
      </p>

      <h2>Kondisi yang Bisa Direfund</h2>
      <ul>
        <li>Pembayaran ganda/duplikat buat paket yang sama (kesalahan teknis).</li>
        <li>Sistem mengaktifkan paket yang salah karena kesalahan kami.</li>
        <li>Dana sudah terpotong tapi status transaksi gagal/error di sisi payment gateway (bukan dibatalkan sendiri oleh pembeli).</li>
      </ul>

      <h2>Kondisi yang Gak Bisa Direfund</h2>
      <ul>
        <li>Paket yang sesinya udah mulai dipakai (sebagian atau seluruhnya).</li>
        <li>Berubah pikiran/gak jadi ikut les setelah paket aktif dan belum ada sesi terpakai lebih dari 7 hari sejak pembayaran (bisa didiskusikan case-by-case lewat kontak di bawah).</li>
        <li>Kesalahan input data peserta oleh pembeli sendiri (bisa dikoreksi lewat admin, bukan alasan refund).</li>
      </ul>

      <h2>Cara Mengajukan Refund</h2>
      <ol className="list-decimal pl-5">
        <li>Hubungi kami lewat WhatsApp/email di bawah, sertakan nomor transaksi atau nama akun.</li>
        <li>Tim kami verifikasi status transaksi lewat sistem &amp; Midtrans.</li>
        <li>Kalau disetujui, dana dikembalikan ke metode pembayaran asal maksimal 14 hari kerja.</li>
      </ol>

      <h2>Kontak Pengajuan Refund</h2>
      <p>
        WhatsApp{" "}
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
