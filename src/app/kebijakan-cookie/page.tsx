import { LegalPageLayout } from "@/components/legal-page-layout";

export default function KebijakanCookiePage() {
  return (
    <LegalPageLayout title="Kebijakan Cookie" updatedAt="10 September 2026">
      <p>
        Aplikasi ini menggunakan cookie dan penyimpanan lokal peramban
        (local/session storage) sebatas yang diperlukan agar Aplikasi dapat
        berfungsi dengan semestinya, dan bukan untuk kepentingan periklanan
        maupun diperjualbelikan kepada pihak ketiga.
      </p>

      <h2>1. Yang Kami Gunakan</h2>
      <ul>
        <li>
          <strong>Cookie sesi masuk (login)</strong> — bersifat esensial,
          digunakan untuk mengenali status masuk Pengguna. Tanpa cookie ini,
          Pengguna tidak dapat mengakses fitur yang memerlukan proses masuk.
        </li>
        <li>
          <strong>Penyimpanan lokal preferensi tampilan</strong> — menyimpan
          pilihan tampilan gelap/terang Pengguna pada peramban yang bersangkutan.
        </li>
        <li>
          <strong>Penyimpanan sesi sumber pendaftaran</strong> — menyimpan
          informasi mengenai sumber rujukan saat Pengguna pertama kali mengakses
          Aplikasi (misalnya tautan WhatsApp), digunakan satu kali pada saat
          pendaftaran untuk kebutuhan internal, dan terhapus otomatis ketika tab
          peramban ditutup.
        </li>
      </ul>

      <h2>2. Yang Tidak Kami Gunakan</h2>
      <p>
        Kami tidak menggunakan cookie pelacak iklan pihak ketiga (Google Ads,
        Facebook Pixel, dan sejenisnya). Analitik kunjungan halaman (Vercel
        Analytics) bersifat <em>cookieless</em> dan agregat, serta tidak
        melacak pengguna secara individual.
      </p>

      <h2>3. Cara Menonaktifkan</h2>
      <p>
        Pengguna dapat menghapus cookie/penyimpanan lokal kapan saja melalui
        pengaturan peramban. Oleh karena cookie sesi masuk bersifat esensial,
        penghapusannya akan secara otomatis mengeluarkan (logout) Pengguna dari
        Aplikasi.
      </p>

      <h2>4. Kontak</h2>
      <p>
        Pertanyaan mengenai penggunaan cookie dapat disampaikan melalui
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
