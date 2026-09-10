import { LegalPageLayout } from "@/components/legal-page-layout";

export default function KebijakanCookiePage() {
  return (
    <LegalPageLayout title="Kebijakan Cookie" updatedAt="10 September 2026">
      <p>
        Aplikasi ini pakai cookie dan penyimpanan lokal browser (local/session
        storage) seperlunya buat bikin aplikasi jalan dengan bener -- bukan buat
        iklan atau dijual ke pengiklan pihak ketiga.
      </p>

      <h2>Yang Kami Pakai</h2>
      <ul>
        <li>
          <strong>Cookie sesi login</strong> -- esensial, dipakai buat ngenalin kamu
          udah login atau belum. Tanpa ini kamu gak bisa akses fitur yang butuh
          login.
        </li>
        <li>
          <strong>Local storage tema</strong> -- nyimpen pilihan tampilan
          gelap/terang kamu di browser ini aja.
        </li>
        <li>
          <strong>Session storage sumber pendaftaran</strong> -- nyimpen dari mana
          kamu pertama kali buka aplikasi (misal link WA), dipakai sekali pas
          pendaftaran buat keperluan internal, otomatis hilang begitu tab
          ditutup.
        </li>
      </ul>

      <h2>Yang Gak Kami Pakai</h2>
      <p>
        Gak ada cookie pelacak iklan pihak ketiga (Google Ads, Facebook Pixel, dll).
        Analitik kunjungan halaman (Vercel Analytics) sifatnya <em>cookieless</em>
        {" "}dan agregat, gak melacak individu.
      </p>

      <h2>Cara Menonaktifkan</h2>
      <p>
        Kamu bisa hapus cookie/local storage lewat pengaturan browser kapan aja.
        Karena cookie login bersifat esensial, menghapusnya bakal otomatis
        me-logout kamu dari Aplikasi.
      </p>

      <h2>Kontak</h2>
      <p>
        Pertanyaan soal cookie: WhatsApp{" "}
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
