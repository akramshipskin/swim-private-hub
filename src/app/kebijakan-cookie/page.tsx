import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { BUSINESS_ADDRESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Kebijakan Cookie | Swim Private Hub",
  description: "Cookie dan penyimpanan lokal apa yang dipakai aplikasi ini, dan buat apa.",
};

export default function KebijakanCookiePage() {
  return (
    <LegalPageLayout title="Kebijakan Cookie" updatedAt="2 Oktober 2026">
      <p>
        Aplikasi ini menggunakan cookie dan penyimpanan lokal peramban
        (local/session storage) agar Aplikasi dapat berfungsi dengan semestinya,
        serta cookie pengenal iklan Meta untuk mengukur iklan kami. Data
        Pengguna tidak diperjualbelikan kepada pihak ketiga.
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
        <li>
          <strong>Cookie iklan Meta (Meta Pixel: _fbp, _fbc)</strong> — dipasang
          untuk pengunjung yang belum masuk dan member, untuk mengukur kunjungan
          dari iklan Facebook/Instagram, pendaftaran, dan pembelian paket. Akun
          coach, pemilik kolam, dan administrator tidak dilacak. Rincian data yang
          dikirim ke Meta ada di{" "}
          <a href="/kebijakan-privasi" className="-my-3 inline-block py-3 text-brand-700 hover:underline">
            Kebijakan Privasi
          </a>{" "}
          bagian 4.
        </li>
      </ul>

      <h2>2. Yang Tidak Kami Gunakan</h2>
      <p>
        Selain Meta Pixel di atas, kami tidak menggunakan cookie pelacak iklan
        pihak ketiga lain (misalnya Google Ads). Analitik kunjungan halaman (Vercel
        Analytics) bersifat <em>cookieless</em> dan agregat, serta tidak
        melacak pengguna secara individual.
      </p>

      <h2>3. Cara Menonaktifkan</h2>
      <p>
        Pengguna dapat menghapus cookie/penyimpanan lokal kapan saja melalui
        pengaturan peramban. Cookie iklan Meta dapat dihapus dengan cara yang
        sama atau dicegah dengan pemblokir iklan pada peramban. Oleh karena cookie sesi masuk bersifat esensial,
        penghapusannya akan secara otomatis mengeluarkan (logout) Pengguna dari
        Aplikasi.
      </p>

      <h2>4. Kontak</h2>
      <p>
        Pertanyaan mengenai penggunaan cookie dapat disampaikan melalui
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
