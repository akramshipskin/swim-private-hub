import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Logotype } from "@/components/ui/logotype";
import { buildOwnerInquiryWaLink } from "@/lib/whatsapp";
import { BUSINESS_ADDRESS } from "@/lib/business";
import { formatRupiah } from "@/lib/format";
import { CANCEL_WINDOW_HOURS, MIN_WITHDRAWAL } from "@/lib/policy";
import { AudienceTabs, FaqTabs, type AudienceSteps, type FaqGroup } from "./landing-tabs";
import { CoachLeaders } from "./coach-leaders";
import { LandingHeader } from "./landing-header";
import { StickyCta } from "./landing-sticky-cta";
import { Reveal } from "@/components/ui/reveal";
import { HeroVideo } from "./hero-video";
import { HeroFx, Magnetic } from "./landing-fx";
import { PAYMENT_METHODS } from "./landing-payments";
import { TestimonialsSection, type Testimonial } from "./landing-testimonials";
import { BeforeAfter, CoachSection, ParentSection, PoolSection, RolePicker } from "./landing-sections";

// Struktur mengikuti referensi Stride (hero foto penuh, badan krem, kartu
// kolam selang-seling, kartu coach, FAQ, CTA gelap). Semua angka & data
// kolam/coach diambil dari database, bukan klaim karangan.

type LandingStats = { poolCount: number; coachCount: number; memberCount: number; attendedCount: number };
type LandingPool = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  facilities: string[];
  photos: string[];
  memberCount: number;
  hours: string | null;
  coachCount: number;
  fromPackage: { total: number; sessions: number } | null;
  // Jam kosong (slot belum dibooking) 7 hari ke depan.
  openSlots7d: number;
};
export type LandingCoach = {
  id: string;
  name: string;
  bio: string | null;
  specialties: string[];
  photoUrl: string | null;
  // "Bersertifikat · FASI +1"; null = belum ada sertifikat disetujui.
  certifiedLabel: string | null;
  bioLine: string | null;
  pools: string[];
};

const OWNER_WA_LINK = buildOwnerInquiryWaLink();

// Video latar hero (desktop saja). Pexels #6012384 (Tima Miroshnichenko, lisensi
// Pexels: bebas dipakai komersial), dipotong detik 2,2-19 supaya wajah perenang
// tidak tampil jelas, 720p tanpa suara (MP4 1,65 MB, WebM 1,40 MB). Disetujui
// Hadi 2 Okt (pilihan B).
const HERO_VIDEO: { mp4: string; webm: string } | null = { mp4: "/videos/hero-perenang.mp4", webm: "/videos/hero-perenang.webm" };

// Jeda animasi pembuka (CSS variable --d, dibaca .hero-rise dan .hero-phone di globals.css).
const heroDelay = (ms: number, floatSeconds?: number) =>
  ({ "--d": `${ms}ms`, ...(floatSeconds ? { "--fd": `${floatSeconds}s` } : {}) }) as CSSProperties;

const AUDIENCES: AudienceSteps[] = [
  {
    key: "ortu",
    label: "Orang tua / peserta",
    steps: [
      { title: "Daftar & tambah peserta", body: "Satu akun untuk kamu sendiri dan/atau beberapa anak. Setiap peserta punya paket dan sisa sesi sendiri." },
      { title: "Pilih coach & kolam, lalu beli paket", body: "Harga tampil rinci sebelum bayar: tiket kolam, jasa coach, dan biaya layanan SPH. Belum yakin? Mulai dari 1 sesi coba. Bayar online lewat Midtrans (saldo di akunmu dipakai dulu), paket langsung aktif." },
      { title: "Booking jam yang masih kosong", body: "Pilih jam dari jadwal coach pilihanmu. Jam yang sudah diambil orang lain otomatis terkunci." },
      { title: "Datang & les", body: `Tidak bisa datang? Batalkan sendiri paling lambat ${CANCEL_WINDOW_HOURS} jam sebelumnya, sesi kembali ke paket. Perkembangan peserta dicatat coach setelah sesi.` },
    ],
  },
  {
    key: "coach",
    label: "Coach",
    steps: [
      { title: "Daftar sebagai coach", body: "Isi profil dan keahlian. Setelah akun disetujui admin, unggah foto dan sertifikat (boleh lebih dari satu) untuk badge Bersertifikat." },
      { title: "Pasang harga & buka jadwal", body: "Tentukan harga paket 4 dan 8 sesimu sendiri, lalu buka tanggal, jam, dan kolam tempat kamu mengajar. Sistem mencegah jadwal bentrok antar kolam." },
      { title: "Tandai kehadiran", body: "Setelah sesi selesai, tandai peserta hadir atau tidak dari menu Riwayat Sesi, lalu isi catatan perkembangan (milestone) peserta." },
      { title: "Cairkan saldo", body: "Bagianmu masuk ke saldo setiap sesi Hadir, lalu bisa dicairkan ke rekening: secepatnya, paling lambat 7 hari kerja." },
    ],
  },
  {
    key: "kolam",
    label: "Pemilik kolam",
    steps: [
      { title: "Gabung sebagai mitra", body: "Daftarkan kolam, lengkapi alamat, jam buka, dan fasilitas." },
      { title: "Pasang harga tiket", body: "Kolam memasang harga tiket untuk paket 4 dan 8 sesi; perubahan langsung berlaku untuk pembelian berikutnya." },
      { title: "Pantau jam ramai", body: "Lihat jam berapa kolam dipakai les privat, oleh coach siapa, setiap hari." },
      { title: "Terima bagi hasil", body: "Bagian kolam (setelah PPh final 0,5%) masuk ke saldo setiap sesi Hadir dan bisa dicairkan ke rekening: secepatnya, paling lambat 7 hari kerja." },
    ],
  },
];

// FAQ dipisah per peran, sama seperti "Cara kerja" (Hadi 18 Sep) -- pertanyaan
// orang tua beda jauh dengan pertanyaan coach dan pemilik kolam.
const FAQ_GROUPS: FaqGroup[] = [
  {
    key: "ortu",
    label: "Orang tua / peserta",
    items: [
      {
        q: "Perlu install aplikasi?",
        a: "Tidak perlu. Swim Private Hub berbasis web, cukup dibuka lewat browser HP atau komputer. Bisa juga ditambahkan ke layar utama HP supaya terbuka seperti aplikasi.",
      },
      {
        q: "Berapa biayanya, dan apa saja yang dibayar?",
        a: "Harga paket terdiri dari tiket masuk kolam, jasa coach, dan biaya layanan SPH (di bawah 7%). Rinciannya tampil sebelum kamu bayar. Paket 4 sesi berlaku 60 hari, paket 8 sesi berlaku 90 hari (lebih hemat per sesi).",
      },
      {
        q: "Bisa coba 1 sesi dulu?",
        a: "Bisa, untuk peserta yang belum pernah punya paket: satu kali per peserta, berlaku 7 hari. Sesi coba tidak bisa dibatalkan sendiri, jadi pilih jam yang pasti bisa hadir.",
      },
      {
        q: "Paket bisa dipakai di kolam mana saja?",
        a: "Paket dibeli dengan memilih kolam dan coach, dan berlaku untuk coach itu di kolam itu. Mau les di kolam atau dengan coach lain, beli paket untuk pilihan tersebut.",
      },
      {
        q: "Satu akun untuk berapa anak?",
        a: "Satu akun orang tua bisa punya banyak peserta: kamu sendiri dan/atau beberapa anak. Paket dan sisa sesi dihitung per peserta, jadi tidak tercampur.",
      },
      {
        q: "Ini les privat satu lawan satu?",
        a: "Ya. Setiap sesi adalah 1 coach untuk 1 peserta, dijadwalkan khusus untuk peserta itu. Bukan kelas gabungan atau grup.",
      },
      {
        q: "Berapa lama satu sesi, dan perlu bawa apa?",
        a: "Satu sesi berlangsung 60 menit. Perlengkapan renang seperti pelampung dan papan dibawa sendiri.",
      },
      {
        q: "Bagaimana kalau batal mendadak?",
        a: `Paket 4 sesi punya jatah batal 2 kali dan paket 8 sesi 4 kali, paling lambat ${CANCEL_WINDOW_HOURS} jam sebelum jadwal; sesinya kembali ke paket. Di luar itu bisa menghubungi admin lewat tombol bantuan di aplikasi. Tidak hadir tanpa membatalkan berarti sesi tetap terpakai. Kalau ditandai Tidak Hadir padahal hadir, laporkan dari menu Riwayat paling lambat 3 hari setelah sesi.`,
      },
      {
        q: "Kalau coach berhalangan, sesinya hangus?",
        a: "Tidak. Coach yang membatalkan sesi otomatis mengembalikan sisa sesi ke paket peserta, dan kamu mendapat notifikasi pembatalannya.",
      },
      {
        q: "Pembayarannya lewat apa?",
        a: "Lewat Midtrans: virtual account bank, QRIS, atau e-wallet. Kalau akunmu punya saldo, saldo dipakai dulu dan sisanya dibayar lewat Midtrans. Paket aktif otomatis setelah pembayaran masuk.",
      },
      {
        q: "Kalau tidak cocok dengan coach-nya?",
        a: "Ajukan ganti coach dari menu Paket; sisa sesi ikut pindah ke coach baru setelah disetujui admin. Kalau coach baru lebih murah, selisihnya masuk ke saldomu. Kalau lebih mahal, kamu menambah selisihnya.",
      },
      {
        q: "Apakah coach-nya bersertifikat?",
        a: 'Coach bisa mengunggah satu atau beberapa sertifikat renang/lifeguard. Badge "Bersertifikat" hanya tampil setelah sertifikat diperiksa dan disetujui admin. Pemeriksaan berarti admin melihat isi file dan mencocokkan nama di sertifikat dengan nama coach; SPH tidak mengonfirmasi ke lembaga penerbitnya. Setiap coach juga disetujui admin sebelum tampil di aplikasi. SPH belum melakukan pemeriksaan latar belakang (background check) pribadi, jadi perhatikan profil dan sertifikatnya sebelum memilih.',
      },
      {
        q: "Umur berapa yang bisa ikut?",
        a: "Tergantung coach dan kolamnya. Di profil setiap coach ada keahliannya, misalnya renang bayi & balita, anak usia dini, atau persiapan kompetisi.",
      },
      {
        q: "Sisa sesi hangus kalau masa berlaku habis?",
        a: "Ya. Sisa sesi yang belum dipakai sampai masa berlaku paket berakhir hangus dan tidak dikembalikan dalam bentuk uang. Masa berlaku tertera saat pembelian.",
      },
    ],
  },
  {
    key: "coach",
    label: "Coach",
    items: [
      {
        q: "Bagaimana cara bergabung sebagai coach?",
        a: "Daftar lewat halaman Daftar Coach, isi profil dan keahlian. Setelah akun disetujui admin, kamu memilih sendiri kolam mitra tempat mengajar di menu Kolam Saya.",
      },
      {
        q: "Bisa mengajar di lebih dari satu kolam?",
        a: "Bisa. Jadwal dibuka per kolam, hargamu sama di semua kolam, dan sistem mencegah kamu membuka jam yang bentrok antar kolam.",
      },
      {
        q: "Kapan bagian saya masuk?",
        a: "Tandai kehadiran paling lambat 24 jam setelah sesi selesai. Sesi Hadir langsung menambah saldo kamu sebesar harga paketmu dibagi jumlah sesinya. Kalau peserta sudah booking tapi tidak datang, tandai Tidak Hadir: kamu tetap mendapat 50% dari bagianmu. Bagianmu dipotong PPh final 0,5% yang disetor SPH atas namamu, kecuali kamu menyerahkan surat pernyataan omzet di bawah Rp 500 juta setahun.",
      },
      {
        q: "Cara mencairkan saldo?",
        a: `Isi rekening sekali di menu Saldo, lalu ajukan pencairan minimal ${formatRupiah(MIN_WITHDRAWAL)}. Pencairan diproses admin secepatnya, paling lambat 7 hari kerja, dan statusnya terlihat di riwayat pencairan.`,
      },
      {
        q: "Kalau saya tidak bisa mengajar?",
        a: "Batalkan sesinya dari menu Jadwal. Sisa sesi member otomatis kembali dan member mendapat notifikasi, jadi tidak ada yang dirugikan diam-diam. Jam itu ditutup untuk booking baru; kalau ternyata bisa mengajar, kamu bisa membukanya lagi.",
      },
      {
        q: "Saya bisa menentukan tarif saya sendiri?",
        a: "Bisa. Kamu memasang harga paket 4 dan 8 sesi di menu Harga, satu harga untuk semua kolam tempat kamu mengajar. Member membayar harga kolam ditambah hargamu dan biaya layanan SPH. Paket yang sudah dibeli tidak ikut berubah saat kamu mengganti harga.",
      },
      {
        q: "Ada biaya untuk bergabung?",
        a: "Tidak ada biaya pendaftaran maupun biaya bulanan. SPH mengambil biaya layanan di bawah 7% yang dibayar member di atas harga kolam dan coach.",
      },
      {
        q: "Bagian saya dipotong komisi?",
        a: "Tidak. Harga jasa yang kamu pasang adalah bagianmu per sesi. Biaya layanan SPH dibayar member di atas harga itu, bukan dipotong dari bagianmu. Yang dipotong hanya PPh final 0,5% (disetor SPH atas namamu).",
      },
      {
        q: "Apa untungnya dibanding cari peserta sendiri?",
        a: "Calon peserta menemukan dan memilihmu dari profil di aplikasi, tanpa janji jumlah peserta. Jadwal, kehadiran, sisa sesi, dan pembayaran diurus sistem, jadi tidak ada tagih-menagih. Peserta yang sudah kamu latih sebelumnya juga bisa didaftarkan lewat kode afiliasimu.",
      },
      {
        q: "Wajib isi catatan perkembangan peserta?",
        a: "Ya. Mulai 1 Oktober 2026, isi catatan perkembangan (milestone) setiap 2 sesi Hadir per peserta. Selama ada catatan yang belum diisi, pengajuan pencairan saldo yang baru ditahan.",
      },
    ],
  },
  {
    key: "kolam",
    label: "Pemilik kolam",
    items: [
      {
        q: "Apa untungnya untuk kolam saya?",
        a: "Kamu bisa membuka jam kosong untuk les privat satuan (1 coach, 1 peserta, bukan sewa club), dan setiap sesi yang terlaksana memberi bagian ke kolam secara otomatis. Kamu juga bisa melihat jam ramai kolam setiap hari. Kolammu tetap kolam umum: pengunjung dari mana pun tetap bisa masuk.",
      },
      {
        q: "Siapa yang menentukan harga paket?",
        a: "Kamu memasang harga tiket kolam untuk paket 4 dan 8 sesi (tiket untuk 1 peserta, 1 pendamping, dan coach-nya), coach memasang harga jasanya sendiri. Harga baru langsung berlaku untuk pembelian berikutnya; paket yang sudah dibeli tidak ikut berubah.",
      },
      {
        q: "Bagaimana pembagian hasilnya?",
        a: "Setiap sesi yang ditandai Hadir, kolam menerima harga tiket paketnya dibagi jumlah sesi, coach menerima harga jasanya dibagi jumlah sesi, dan biaya layanan menjadi bagian SPH. Bagian kolam dan coach dipotong PPh 0,5% kecuali sudah menyerahkan surat pernyataan omzet di bawah Rp 500 juta.",
      },
      {
        q: "Ada biaya untuk bergabung?",
        a: "Tidak ada biaya pendaftaran maupun biaya bulanan. SPH mengambil biaya layanan di bawah 7% yang dibayar member di atas harga kolam dan coach.",
      },
      {
        q: "Saya juga harus menyediakan coach?",
        a: "Tidak harus. Coach yang sudah terdaftar di platform bisa diafiliasikan ke kolam kamu; kamu tetap bisa memakai coach sendiri kalau punya.",
      },
      {
        q: "Bagaimana cara bergabung sebagai mitra?",
        a: "Daftar lewat halaman Daftarkan Kolam atau hubungi kami lewat WhatsApp. Setelah kolam disetujui admin (diperiksa paling lambat 1×24 jam), kolam kamu langsung bisa menerima booking. Halaman ini menampilkan kolam-kolam paling aktif, jadi kemunculannya di sini mengikuti aktivitas kolammu.",
      },
    ],
  },
];

// Angka social proof (badge hero + strip statistik) baru ditampilkan setelah
// jumlah member beneran lewat ambang ini -- sebelum ada pengguna asli,
// angka kecil ("5 kolam", "10 member") terkesan sepi/karangan alih-alih
// meyakinkan (temuan sweep 28 Sep). Sesuaikan begitu pertumbuhan asli mulai
// kelihatan; nilainya keputusan tampilan, bukan aturan bisnis.
const MIN_MEMBERS_TO_SHOW_STATS = 20;
// Kartu kolam: "N member les di sini" baru tampil kalau kolam itu sudah punya
// segini member (Hadi 29 Sep); di bawahnya baris itu dikosongkan.
const MIN_POOL_MEMBERS_TO_SHOW = 15;
// Angka jam kosong baru tampil kalau cukup banyak (Hadi 2 Okt malam, #17).
const MIN_OPEN_SLOTS_TO_SHOW = 5;

export default function LandingView({ stats, pools, coaches, testimonials }: { stats: LandingStats; pools: LandingPool[]; coaches: LandingCoach[]; testimonials: Testimonial[] }) {
  const showStats = stats.memberCount >= MIN_MEMBERS_TO_SHOW_STATS;
  const STATS = [
    { value: stats.poolCount, label: "Kolam mitra" },
    { value: stats.coachCount, label: "Coach aktif" },
    { value: stats.memberCount, label: "Member terdaftar" },
    { value: stats.attendedCount, label: "Sesi terlaksana" },
  ];

  return (
    // Landing selalu tampilan terang (warna dipaku), tidak ikut dark mode.
    <main className="flex min-h-screen flex-col bg-fixed-cream text-fixed-ink" style={{ colorScheme: "light" }}>
      {/* Hero (redesain 1 Okt): foto perenang memenuhi hero dengan lapisan gelap
          di sisi teks; teks di kiri, tampilan HP asli aplikasi di kanan (layar
          lebar) sebagai bukti produk. Muat di satu layar (100dvh), maksimal
          dua baris judul, dua tombol. Fakta pendukung ada di bilah di bawahnya,
          bukan di dalam hero. */}
      <LandingHeader />

      <section className="relative isolate overflow-hidden bg-fixed-night text-white">
        <Image
          src="/images/landing/hero-swim-v2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[72%_20%]"
        />
        {HERO_VIDEO && <HeroVideo {...HERO_VIDEO} poster="/images/landing/hero-swim-v2.jpg" />}
        <HeroFx />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-fixed-night via-fixed-night/80 to-fixed-night/20 max-lg:bg-gradient-to-t max-lg:from-fixed-night max-lg:via-fixed-night/70 max-lg:to-fixed-night/0" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-fixed-night" />

        <div className="mx-auto grid min-h-[100dvh] w-full max-w-6xl items-end gap-10 lg:items-center px-4 pb-14 pt-28 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.65fr)] lg:pt-24">
          <div>
            <h1 className="text-[clamp(2rem,3.2vw,2.9rem)] font-semibold leading-[1.06] tracking-tight lg:w-[46rem]">
              {/* Tiap baris "muncul dari bawah air" (garis potong = permukaan). */}
              <span className="hero-mask">
                <span style={heroDelay(0)}>Aplikasi les renang privat.</span>
              </span>
              <span className="hero-mask text-fixed-lime">
                <span style={heroDelay(120)}>Pilih coach, pilih kolam,</span>
              </span>
              <span className="hero-mask text-fixed-lime">
                <span style={heroDelay(240)}>
                  dan{" "}
                  <span className="wave-under">
                    pilih jamnya.
                    <span aria-hidden="true" className="wave-under__line" style={heroDelay(900)}>
                      <svg viewBox="0 0 200 20" preserveAspectRatio="none">
                        <path d="M0 10 C12.5 0 37.5 20 50 10 C62.5 0 87.5 20 100 10 C112.5 0 137.5 20 150 10 C162.5 0 187.5 20 200 10" fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                      </svg>
                    </span>
                  </span>
                </span>
              </span>
            </h1>
            <p className="hero-slide mt-6 max-w-lg text-base text-white/85 sm:text-lg" style={heroDelay(300)}>
              Anak atau kamu belajar berenang dengan coach pilihan sendiri, di kolam mitra Swim Private Hub. Perkembangan tercatat, pembayaran jelas.
            </p>
            <div className="hero-rise mt-8 flex flex-wrap gap-3" style={heroDelay(480)}>
              <Magnetic>
                <Link href="/register" className="inline-flex items-center rounded-full bg-fixed-lime px-7 py-3.5 text-base font-semibold text-fixed-ink transition-transform hover:bg-fixed-lime-100 active:scale-[0.98]">
                  Daftar gratis
                </Link>
              </Magnetic>
              <a href="#kolam" className="inline-flex items-center rounded-full border border-white/40 px-7 py-3.5 text-base font-semibold transition-colors hover:bg-white/10">
                Lihat kolam
              </a>
            </div>
            <p className="hero-rise mt-5 text-sm text-white/75" style={heroDelay(600)}>
              Coach atau punya kolam? Gabung sebagai mitra:{" "}
              <Link href="/daftar-coach" prefetch={false} className="-my-3 inline-block py-3 font-semibold text-white underline underline-offset-4 hover:text-fixed-lime">Daftar sebagai coach</Link>
              {" · "}
              <Link href="/daftar-kolam" prefetch={false} className="-my-3 inline-block py-3 font-semibold text-white underline underline-offset-4 hover:text-fixed-lime">Daftarkan kolam</Link>
            </p>
          </div>

          <div aria-hidden="true" data-tilt className="hero-tilt relative hidden h-[34rem] lg:-mr-10 lg:block">
            <Image
              src="/images/landing/produk-cari-coach.png"
              alt=""
              width={390}
              height={844}
              sizes="200px"
              className="hero-phone absolute bottom-[-5rem] left-0 w-[12.5rem] rounded-[2rem] border border-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]"
              style={heroDelay(250, 7)}
            />
            <Image
              src="/images/landing/produk-booking.png"
              alt=""
              width={390}
              height={844}
              sizes="220px"
              className="hero-phone absolute bottom-[-8rem] right-0 w-[13.5rem] rounded-[2rem] border border-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]"
              style={heroDelay(420, 8.5)}
            />
          </div>
        </div>
      </section>

      {/* Bilah fakta: empat hal yang paling sering ditanyakan orang tua, tiap
          poin bersumber dari S&K dan FAQ. Bukan kartu: garis pemisah saja. */}
      <section aria-label="Ringkasan layanan" className="border-b border-fixed-ink/10">
        <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 lg:grid-cols-4">
          {[
            { t: "60 menit, 1 coach", d: "Untuk 1 anak, bukan kelas gabungan." },
            { t: "Tiket masuk termasuk", d: "Peserta tidak membayar lagi di loket." },
            { t: "Sertifikat diperiksa", d: "Badge Bersertifikat tampil setelah admin menyetujui." },
            { t: "Harga jelas di depan", d: "Tiket, jasa coach, dan biaya layanan tampil sebelum bayar." },
          ].map((f, i) => (
            <li key={f.t} className={`fx-fact px-4 py-6 lg:py-8 ${i % 2 === 1 ? "border-l border-fixed-ink/10" : ""} ${i > 1 ? "border-t border-fixed-ink/10 lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-fixed-ink/10" : ""}`}>
              <Reveal delay={i * 70}>
                <p className="text-lg font-semibold leading-snug sm:text-xl">{f.t}</p>
                <p className="mt-1 text-sm text-fixed-muted">{f.d}</p>
              </Reveal>
            </li>
          ))}
        </ul>
        {showStats && (
          <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 border-t border-fixed-ink/10 px-4 py-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="text-3xl font-semibold tabular-nums sm:text-4xl">{s.value.toLocaleString("id-ID")}</dd>
                <dt className="text-sm text-fixed-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* HP: tombol daftar menempel di bawah setelah hero (pengganti baris lompat). */}
      <StickyCta />

      <RolePicker />
      <BeforeAfter />
      <ParentSection />

      {/* Kolam: maksimal 5 kolam paling laris, lengkap dengan foto, fasilitas,
          dan jumlah member yang les di situ. */}
      <section id="kolam" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20">
        <Reveal className="mb-10 text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Kolam mitra</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-fixed-muted">
            Setiap kolam punya jadwal coach, harga paket, dan fasilitasnya sendiri. Info di bawah ini langsung diambil
            dari data kolam, bukan brosur lama.
          </p>
        </Reveal>
        {pools.length === 0 ? (
          <p className="text-center text-fixed-muted">Kolam mitra segera hadir.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {pools.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <article className="group grid overflow-hidden rounded-3xl bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_-28px_rgba(20,20,15,0.35)] md:grid-cols-2">
                  <div className={`relative flex items-end overflow-hidden bg-fixed-lime-100 p-8 ${p.photos[0] ? "min-h-64" : "min-h-36 md:min-h-64"} ${i % 2 === 1 ? "md:order-2" : ""}`}>
                    {!p.photos[0] && (
                      // Belum ada foto: gradien lime brand (bukan blok polos) supaya kartu tidak terlihat bolong.
                      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(159,204,31,0.45),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(198,255,61,0.35),transparent_50%)]" />
                    )}
                    {p.photos[0] && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.photos[0]} alt={`Foto ${p.name}`} className="parallax-img absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
                      </>
                    )}
                    <div className={`relative ${p.photos[0] ? "text-white" : ""}`}>
                      <p className={`text-sm font-medium ${p.photos[0] ? "text-white/80" : "text-fixed-ink/70"}`}>
                        Kolam mitra
                      </p>
                      <p className="text-3xl font-semibold leading-tight">{p.name}</p>
                      {p.memberCount >= MIN_POOL_MEMBERS_TO_SHOW && (
                        <p className={`mt-1 text-sm ${p.photos[0] ? "text-white/85" : "text-fixed-muted"}`}>
                          {p.memberCount} member punya paket di sini
                        </p>
                      )}
                      {p.openSlots7d >= MIN_OPEN_SLOTS_TO_SHOW && (
                        <p className={`mt-1 text-sm font-medium ${p.photos[0] ? "text-white" : "text-fixed-ink"}`}>
                          {p.openSlots7d} jam kosong 7 hari ke depan
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 p-8">
                    {p.description ? (
                      <p className="text-base text-fixed-ink">{p.description}</p>
                    ) : (
                      <p className="text-base text-fixed-muted">Les renang privat dengan coach pilihan di {p.name}.</p>
                    )}
                    <dl className="grid grid-cols-2 gap-4 border-t border-fixed-ink/10 pt-4 text-sm">
                      <div>
                        <dt className="text-fixed-muted">Lokasi</dt>
                        <dd className="font-semibold">{p.address ?? "Segera diinformasikan"}</dd>
                      </div>
                      <div>
                        <dt className="text-fixed-muted">Jam buka</dt>
                        <dd className="font-semibold">{p.hours ?? "Hubungi admin"}</dd>
                      </div>
                      <div>
                        <dt className="text-fixed-muted">Harga paket</dt>
                        <dd className="font-semibold">{p.fromPackage ? `${p.fromPackage.sessions} sesi mulai ${formatRupiah(p.fromPackage.total)}` : "Segera hadir"}</dd>
                      </div>
                      <div>
                        <dt className="text-fixed-muted">Coach</dt>
                        <dd className="font-semibold">{p.coachCount} coach</dd>
                      </div>
                    </dl>
                    {p.facilities.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm text-fixed-muted">Fasilitas</p>
                        <ul className="flex flex-wrap gap-1.5">
                          {p.facilities.map((f) => (
                            <li key={f} className="fx-chip rounded-full bg-fixed-cream px-3 py-1 text-sm">{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {p.photos.length > 1 && (
                      <ul className="flex gap-2">
                        {p.photos.slice(1, 4).map((url, k) => (
                          <li key={url + k} className="min-w-0 flex-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Foto ${p.name}`} className="h-20 w-full rounded-lg object-cover" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <CoachSection />

      {/* Coach: maksimal 5 coach gaya referensi Stride "meet the leaders" --
          kartu polaroid agak miring, nyebar kiri-kanan, muncul satu per satu
          saat scroll vertikal. Info lengkap tiap coach ada di /pelatih/[id]. */}
      <section id="coach" className="scroll-mt-20 overflow-x-clip bg-fixed-sand py-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal className="mb-14 text-center">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Kenalan dengan coach</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-fixed-muted">
              Lihat umur, keahlian, label sertifikat yang sudah diperiksa admin, dan kolam tempat mengajar. Jadwal, fasilitas
              kolam, dan file sertifikat terbuka setelah kamu mendaftar.
            </p>
          </Reveal>
          {coaches.length === 0 ? (
            <p className="text-center text-fixed-muted">Coach segera hadir.</p>
          ) : (
            <CoachLeaders coaches={coaches} />
          )}
        </div>
      </section>

      <PoolSection waLink={OWNER_WA_LINK} />

      {/* Cara kerja */}
      <section id="cara-kerja" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14 sm:py-20">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">Cara kerjanya</h2>
          <p className="mt-3 max-w-xl text-base text-fixed-muted">Pilih peranmu untuk melihat langkahnya.</p>
        </Reveal>
        <Reveal className="mt-8" delay={100}>
          <AudienceTabs audiences={AUDIENCES} />
        </Reveal>
        <p className="mt-10 text-sm text-fixed-muted">
          Punya kolam renang?{" "}
          <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-fixed-ink underline underline-offset-4">
            Tanya soal kemitraan
          </a>{" "}
          atau{" "}
          <Link href="/daftar-kolam" className="font-semibold text-fixed-ink underline underline-offset-4">daftarkan kolam</Link>. Coach bisa{" "}
          <Link href="/daftar-coach" className="font-semibold text-fixed-ink underline underline-offset-4">daftar di sini</Link>.
        </p>
      </section>

      <TestimonialsSection items={testimonials} />

      {/* FAQ per peran */}
      <section id="faq" className="mx-auto grid w-full max-w-6xl scroll-mt-20 gap-8 px-4 pb-14 sm:pb-20 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">Pertanyaan umum</h2>
          <p className="mt-3 max-w-sm text-base text-fixed-muted">Pilih peranmu, pertanyaannya berbeda-beda.</p>
        </Reveal>
        <Reveal delay={100}>
          <FaqTabs groups={FAQ_GROUPS} />
        </Reveal>
      </section>

      {/* Gelombang: peralihan dari badan krem ke footer gelap (mengalir pelan di desktop). */}
      <div aria-hidden="true" className="footer-wave mt-auto -mb-px overflow-hidden text-fixed-ink">
        <svg viewBox="0 0 2880 48" preserveAspectRatio="none" className="h-8 sm:h-12">
          <path d="M0 24 C240 48 480 0 720 24 C960 48 1200 0 1440 24 C1680 48 1920 0 2160 24 C2400 48 2640 0 2880 24 L2880 48 L0 48 Z" fill="currentColor" />
        </svg>
      </div>

      {/* CTA + footer gelap */}
      <footer className="bg-fixed-ink text-white">
        <Reveal className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Siap mulai les renang?</h2>
            <Magnetic>
              <Link href="/register" className="fx-pulse inline-flex shrink-0 items-center rounded-full bg-fixed-lime px-7 py-3.5 text-base font-semibold text-fixed-ink transition-transform hover:bg-fixed-lime-100 active:scale-[0.98]">
                Daftar gratis
              </Link>
            </Magnetic>
          </div>
          {/* Alasan percaya (Hadi 2 Okt malam, #31): hanya fakta yang dijaga sistem. */}
          <ul aria-label="Alasan percaya" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Coach disetujui admin", "Badge Bersertifikat tampil setelah sertifikatnya diperiksa."],
              ["Harga rinci sebelum bayar", "Tiket kolam, jasa coach, dan biaya layanan terlihat terpisah."],
              ["Pembayaran lewat Midtrans", "Paket langsung aktif setelah pembayaran berhasil."],
              ["Bisa batal sendiri", `Paling lambat ${CANCEL_WINDOW_HOURS} jam sebelum jadwal, sesi kembali ke paket sesuai jatah.`],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/15">
                <p className="font-semibold text-white">{t}</p>
                <p className="mt-1 text-sm text-white/70">{d}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Metode pembayaran: semua logo dirender satu warna lime lewat CSS
            mask, jadi rapi walau warna asli tiap logo beda-beda. */}
        <div className="mx-auto max-w-6xl border-t border-white/15 px-4 py-8">
          <p className="mb-4 text-center text-sm text-white/70">Pembayaran diproses lewat Midtrans</p>
          <ul className="mx-auto flex max-w-[42rem] flex-wrap items-center justify-center gap-x-8 gap-y-5">
            {PAYMENT_METHODS.map((m) =>
              m.logo ? (
                <li key={m.label}>
                  <span
                    role="img"
                    aria-label={m.label}
                    className="fx-logo block h-5 w-16 bg-fixed-lime"
                    style={{
                      WebkitMaskImage: `url(${m.logo})`,
                      maskImage: `url(${m.logo})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                </li>
              ) : (
                <li key={m.label} className="flex h-5 w-16 items-center justify-center text-sm font-semibold tracking-wide text-fixed-lime">
                  {m.label}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 border-t border-white/15 px-4 py-10 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
              <Logotype className="text-lg text-white" />
            </div>
            <p>Aplikasi les renang privat. Pilih coach, pilih kolam, dan pilih jamnya.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-white">Hubungi kami</p>
            <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
              WhatsApp +62 821-1717-3124
            </a>
            <a href="mailto:hello@swimprivatehub.biz.id" className="hover:text-white hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
              hello@swimprivatehub.biz.id
            </a>
            <p>{BUSINESS_ADDRESS}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-white">Gabung</p>
            <Link href="/register" className="fx-link hover:text-white max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Daftar sebagai member</Link>
            <Link href="/daftar-coach" className="fx-link hover:text-white max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Daftar sebagai coach</Link>
            <Link href="/daftar-kolam" className="fx-link hover:text-white max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Daftarkan kolam</Link>
            <Link href="/panduan" className="fx-link hover:text-white max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Panduan pemakaian</Link>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-white">Ketentuan</p>
            <Link href="/syarat-ketentuan" className="fx-link hover:text-white max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Syarat &amp; Ketentuan</Link>
            <Link href="/kebijakan-privasi" className="fx-link hover:text-white max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Kebijakan Privasi</Link>
            <Link href="/kebijakan-pengembalian" className="fx-link hover:text-white max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Kebijakan Pengembalian</Link>
            <Link href="/kebijakan-cookie" className="fx-link hover:text-white max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Kebijakan Cookie</Link>
          </div>
        </div>

        <p className="pb-24 text-center text-xs text-white/50 md:pb-8">© 2026 Swim Private Hub</p>
      </footer>
    </main>
  );
}
