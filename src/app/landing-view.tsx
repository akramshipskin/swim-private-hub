import { cloneElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildOwnerInquiryWaLink } from "@/lib/whatsapp";

// Icon garis 24x24 stroke 1.8, dicopy persis dari ICON set di
// src/app/panduan/panduan-view.tsx (dikonversi ke JSX) biar bentuknya
// konsisten di seluruh app -- tiap icon bentuknya gabungan beberapa shape
// (rect/circle/path), bukan cuma 1 path tunggal.
function IconWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  family: (
    <IconWrap>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"
      />
      <circle cx="8" cy="8" r="3.2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 4.2a3.2 3.2 0 0 1 0 6.2M20 19v-1a4 4 0 0 0-2.6-3.75"
      />
    </IconWrap>
  ),
  lock: (
    <IconWrap>
      <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </IconWrap>
  ),
  barChart: (
    <IconWrap>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M12 20V4M20 20v-7" />
      <path strokeLinecap="round" d="M2.5 20h19" />
    </IconWrap>
  ),
  inboxDownload: (
    <IconWrap>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 13h4l2 2.5h5l2-2.5h4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 13 5 6a1.5 1.5 0 0 1 1.5-1.2h11A1.5 1.5 0 0 1 19 6l1.5 7"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 13v5.5A1.5 1.5 0 0 0 5 20h14a1.5 1.5 0 0 0 1.5-1.5V13"
      />
    </IconWrap>
  ),
  creditCard: (
    <IconWrap>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path strokeLinecap="round" d="M3 9.5h18M6 15h4" />
    </IconWrap>
  ),
  bell: (
    <IconWrap>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 9.5a6 6 0 1 1 12 0c0 4 1.2 5.2 1.7 5.9.3.4 0 1-.5 1H4.8c-.5 0-.8-.6-.5-1 .5-.7 1.7-1.9 1.7-5.9Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </IconWrap>
  ),
  swimmer: (
    <IconWrap>
      <circle cx="12" cy="6" r="2.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.5v6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3.5 18q2-2 4 0t4 0t4 0t4 0" />
    </IconWrap>
  ),
  clipboardCheck: (
    <IconWrap>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 13 2 2 4-4.5" />
    </IconWrap>
  ),
  wrench: (
    <IconWrap>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.5 6.5a4 4 0 0 1-5.4 5.4L4 17l3 3 5.1-5.1a4 4 0 0 1 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z"
      />
    </IconWrap>
  ),
  chat: (
    <IconWrap>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L4 20l1-4.6a8.38 8.38 0 0 1-.9-3.9A8.38 8.38 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z"
      />
    </IconWrap>
  ),
  checkCircle: (
    <IconWrap>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 12.5 2.5 2.5L16.5 9" />
    </IconWrap>
  ),
  phone: (
    <IconWrap>
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path strokeLinecap="round" d="M11 18.2h2" />
    </IconWrap>
  ),
  bolt: (
    <IconWrap>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </IconWrap>
  ),
  cross: (
    <IconWrap>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </IconWrap>
  ),
  quote: (
    <IconWrap>
      <path d="M9.5 8c-2.5 0-4.5 2-4.5 4.5S7 17 9.5 17c.3 0 .5-.2.5-.5v-1c0-.3-.2-.5-.5-.5-1.4 0-2.5-1.1-2.5-2.5S8.1 10 9.5 10c.3 0 .5-.2.5-.5v-1c0-.3-.2-.5-.5-.5Zm9 0c-2.5 0-4.5 2-4.5 4.5S16 17 18.5 17c.3 0 .5-.2.5-.5v-1c0-.3-.2-.5-.5-.5-1.4 0-2.5-1.1-2.5-2.5S17.1 10 18.5 10c.3 0 .5-.2.5-.5v-1c0-.3-.2-.5-.5-.5Z" />
    </IconWrap>
  ),
};

type IconName = keyof typeof ICONS;

function Icon({ name, className }: { name: IconName; className?: string }) {
  return cloneElement(ICONS[name], { className });
}

const OWNER_FEATURES: { icon: IconName; tone: keyof typeof roleToneClasses; title: string; desc: string }[] = [
  {
    icon: "family",
    tone: "brand",
    title: "1 akun, banyak anak",
    desc: "Orang tua daftar sekali, tambah beberapa anak sekaligus. Sisa sesi kehitung per anak, gak ketuker.",
  },
  {
    icon: "lock",
    tone: "accent",
    title: "Slot terkunci otomatis",
    desc: "Begitu 1 member ambil jam tertentu, slot langsung kekunci buat member lain. Gak ada lagi jadwal bentrok.",
  },
  {
    icon: "creditCard",
    tone: "admin",
    title: "Pembayaran online, paket auto-aktif",
    desc: "Member bayar lewat halaman pembayaran resmi, paket langsung aktif otomatis begitu bayar berhasil — gak perlu konfirmasi manual.",
  },
  {
    icon: "barChart",
    tone: "coach",
    title: "Honor coach kehitung otomatis",
    desc: "Cuma sesi yang ditandain 'Hadir' yang kehitung valid. Tinggal buka laporan Kinerja Coach per rentang tanggal, gak perlu rekap manual.",
  },
  {
    icon: "inboxDownload",
    tone: "brand",
    title: "Import data lama sekali klik",
    desc: "Migrasi dari catatan Excel/chat WhatsApp bisa lewat template import — sistem yang bikinin akun dan paketnya sekaligus.",
  },
  {
    icon: "bell",
    tone: "accent",
    title: "Notifikasi dua arah",
    desc: "Member booking → coach dapet notif. Coach buka slot baru → member dapet notif. Nyampe walau aplikasi lagi ketutup.",
  },
];

const TRUST_PILLS = [{ label: "Web-based" }, { label: "Real-time" }, { label: "Notifikasi otomatis" }];

const PAIN_POINTS = [
  "Sisa sesi dihitung manual dari scroll chat WhatsApp berhari-hari ke belakang.",
  "Dua orang tua booking jam yang sama ke coach yang sama — ketauannya pas udah di lokasi.",
  "Lupa siapa yang udah bayar, siapa yang belum, jadi harus nagih satu-satu.",
  "Rekap honor coach di akhir bulan makan waktu berjam-jam, ngitung manual dari catatan kehadiran.",
  "Data pelanggan lama nyebar di Excel, chat, dan buku catatan — gak ada satu sumber yang bisa dipercaya.",
  "Member nanya jadwal kosong, admin harus cek manual satu-satu ke tiap coach.",
];

const roleToneClasses = {
  brand: { bg: "bg-brand-50", text: "text-brand-700" },
  accent: { bg: "bg-accent-50", text: "text-accent-600" },
  admin: { bg: "bg-brand-100", text: "text-brand-700" },
  coach: { bg: "bg-success-bg", text: "text-success-text" },
};

const COMPARISON_ROWS: { manual: string; generik: string; sistem: string }[] = [
  {
    manual: "Sisa sesi dihitung manual dari chat WhatsApp",
    generik: "Gak ada konsep 'sisa sesi per anak' sama sekali",
    sistem: "Kehitung otomatis per anak, real-time",
  },
  {
    manual: "Jadwal bisa bentrok tanpa ketauan",
    generik: "Slot generik, gak ngerti 1 coach = 1 jam = 1 murid",
    sistem: "Slot terkunci otomatis begitu dibooking",
  },
  {
    manual: "Konfirmasi pembayaran manual satu-satu",
    generik: "Payment ada, tapi paket/kuota sesi harus diatur manual terpisah",
    sistem: "Paket aktif otomatis begitu bayar berhasil",
  },
  {
    manual: "Rekap honor coach manual tiap akhir bulan",
    generik: "Gak ada konsep 'honor per kehadiran' bawaan",
    sistem: "Laporan kinerja coach sekali klik, per rentang tanggal",
  },
  {
    manual: "Data pelanggan nyebar di Excel/chat/buku",
    generik: "Bisa import kontak, tapi gak ngerti struktur 1 akun banyak anak",
    sistem: "Satu database, satu sumber kebenaran, 1 akun banyak anak",
  },
  {
    manual: "Member harus tanya admin buat cek jadwal kosong",
    generik: "Kebijakan pembatalan generik, gak ada jatah per paket",
    sistem: "Member lihat & booking slot kosong sendiri, jatah batal transparan",
  },
];

const HOW_IT_WORKS = [
  {
    title: "Daftar & bayar",
    desc: "Orang tua isi data diri, tentuin siapa aja yang mau les (diri sendiri dan/atau anak), beli paket, bayar online (VA/QRIS/e-wallet/kartu). Paket langsung aktif otomatis begitu bayar berhasil.",
    mockup: { label: "Order #PKG-8x-renang", value: "Rp 750.000", status: "Aktif" },
  },
  {
    title: "Booking real-time",
    desc: "Member pilih anak, coach, tanggal, dan jam yang masih kosong. Begitu diklik, slot itu langsung terkunci — member lain otomatis lihat status 'Sudah dibooking'.",
    mockup: { label: "Coach Rima · Sabtu 08.00", value: "1 slot tersisa", status: "Kekunci" },
  },
  {
    title: "Kelola & pantau",
    desc: "Coach tandai Hadir/Gak Hadir abis sesi selesai — ini dasar hitung honor. Admin pantau semuanya dari satu dashboard: booking, pembayaran, kinerja coach per rentang tanggal.",
    mockup: { label: "Kinerja Coach · Sep 2026", value: "Rekap otomatis", status: "Siap dilihat" },
  },
];

const FAQ_ITEMS = [
  {
    q: "Perlu install aplikasi khusus gak?",
    a: "Gak perlu. Ini web-based, tinggal buka lewat browser HP atau komputer. Bisa juga \"dipasang\" ke layar utama HP biar kebuka kayak aplikasi biasa, tanpa lewat Play Store/App Store.",
  },
  {
    q: "Data pelanggan lama saya (Excel/chat) bisa dipindahin?",
    a: "Bisa, lewat template import — isi nama, kontak, paket, dan sisa sesi, sistem yang bikinin akun dan paketnya sekaligus. Gak perlu input satu-satu manual.",
  },
  {
    q: "Gimana kalau member mau batalin booking mendadak?",
    a: "Ada jatah pembatalan mandiri per paket (bisa diatur), dengan syarat minimal beberapa jam sebelum jadwal. Kalau di luar itu atau jatah udah abis, member tetap bisa minta bantuan admin langsung lewat WhatsApp yang pesannya udah keisi otomatis.",
  },
  {
    q: "Pembayarannya lewat mana?",
    a: "Terintegrasi payment gateway resmi — mendukung transfer virtual account bank, QRIS, e-wallet (GoPay, OVO, Dana, ShopeePay), dan kartu kredit/debit.",
  },
  {
    q: "Berapa lama proses setup-nya?",
    a: "Gak butuh training panjang — alurnya udah familiar kayak booking online pada umumnya. Hubungi kami buat bahas kebutuhan spesifik tempat les Anda (jumlah coach, jenis paket, dll).",
  },
];

const OWNER_WA_LINK = buildOwnerInquiryWaLink();

export default function LandingView() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero band -- gelap, gradient dalem ke terang, terinspirasi gaya
          graphify.com (dark hero -> fade ke body terang) tapi dipalet ulang
          pake warna brand sendiri (teal tua -> --background), bukan hijau
          punya mereka. Header ikut duduk di band gelap ini, makanya
          teks/tombolnya versi terang, beda dari header biasa di halaman lain. */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #052229 0%, #0b3a45 32%, #0e5a6e 58%, var(--background) 100%)",
        }}
      >
        <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Les Renang Cianjur"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
              priority
            />
            <span className="font-semibold tracking-tight text-white">Les Renang Cianjur</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="!text-white/80 hover:!bg-white/10 hover:!text-white">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="!bg-white !text-brand-700 hover:!bg-white/90">
                Daftar
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero -- pitch utama ke pemilik kolam/tempat les (audiens B2B),
            bukan ke orang tua. Section "buat orang tua" ada di bawah,
            terpisah & lebih ringkas, sesuai request Hadi. */}
        <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-16 pt-10 text-center sm:pb-24 sm:pt-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
            Sistem booking &amp; manajemen les renang
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-white sm:text-6xl">
            Kelola les renang tanpa bolak-balik <span className="text-accent-500">chat WhatsApp</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">
            Jadwal bentrok, sisa sesi dihitung manual dari chat, lupa siapa yang udah bayar — sistem ini beresin
            semuanya. Member booking sendiri, coach kelola jadwal sendiri, Anda tinggal pantau dari satu dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer">
              <Button className="!rounded-full !bg-white !text-brand-700 hover:!bg-white/90">
                <Icon name="chat" className="h-4 w-4" />
                Punya Kolam Renang? Hubungi Kami
              </Button>
            </a>
            <a href="/panduan">
              <Button
                variant="secondary"
                className="!rounded-full !border-white/25 !bg-white/5 !text-white hover:!bg-white/10"
              >
                Lihat Demo &amp; Fitur Lengkap
              </Button>
            </a>
          </div>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {TRUST_PILLS.map((p, i) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/55"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: i % 2 === 0 ? "#fb923c" : "#22d3ee" }}
                />
                {p.label}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Problem -- agitate dulu sebelum kasih solusi, pola sales page klasik. */}
      <section className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-accent-600">Kedengeran familiar?</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Ngurus les renang manual, capeknya di mana-mana
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PAIN_POINTS.map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger-text">
                <Icon name="cross" className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm text-text-muted">{p}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-lg text-center text-sm font-medium text-text">
          Semua itu kejadian bukan karena Anda kurang teliti — tapi karena ngatur ini semua pake chat &amp; Excel
          emang gak dirancang buat scale.
        </p>
      </section>

      {/* Features -- framing buat pemilik/pengelola. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Kenapa ini beda</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Dibangun buat masalah operasional nyata
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
            Bukan sistem booking generik — tiap fitur disesuaikan sama cara kerja les privat.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OWNER_FEATURES.map((f) => (
            <Card key={f.title}>
              <CardBody>
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${roleToneClasses[f.tone].bg} ${roleToneClasses[f.tone].text}`}
                >
                  <Icon name={f.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-text">{f.title}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{f.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Kenapa ini, bukan WA+Excel ATAU aplikasi booking generik --
          perbandingan 3 arah, bukan cuma 2. Argumen "kenapa bukan yang
          generik" ini yang tadinya belum ada di halaman ini. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">
            Kenapa ini, bukan itu
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Bukan cuma lebih baik dari manual — juga lebih pas dari aplikasi booking generik
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-text-muted">
            Aplikasi booking umum dirancang buat salon atau klinik — slotnya generik. Sistem ini dari awal
            dirancang ngerti konsep <strong>1 paket = 1 anak</strong>, <strong>sesi berkurang tiap booking</strong>,
            dan <strong>honor coach dari kehadiran</strong>.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="px-4 py-3 text-left font-semibold text-text-subtle">Cara manual</th>
                <th className="px-4 py-3 text-left font-semibold text-text-subtle">Aplikasi booking generik</th>
                <th className="px-4 py-3 text-left font-semibold text-brand-700">Les Renang Cianjur</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((r) => (
                <tr key={r.manual} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 align-top text-text-muted">
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-danger-bg text-danger-text align-middle">
                      <Icon name="cross" className="h-3 w-3" />
                    </span>
                    {r.manual}
                  </td>
                  <td className="px-4 py-3 align-top text-text-muted">
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning-bg text-warning-text align-middle">
                      <Icon name="cross" className="h-3 w-3" />
                    </span>
                    {r.generik}
                  </td>
                  <td className="px-4 py-3 align-top font-medium text-text">
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-bg text-success-text align-middle">
                      <Icon name="checkCircle" className="h-3 w-3" />
                    </span>
                    {r.sistem}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payoff -- 1 skenario konkret (ala "the answer is a path, not a
          vibe"-nya graphify), bukan klaim abstrak. Fakta: slot-lock ini
          beneran diverifikasi jalan di sesi kerja sebelumnya. */}
      <section className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Contoh nyata</span>
          <h3 className="mt-2 text-lg font-semibold text-text sm:text-xl">
            Sabtu malam, 3 orang tua chat WA bareng nanya slot Minggu pagi
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-danger-bg p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-danger-text">Cara manual</p>
              <p className="mt-1.5 text-sm text-text-muted">
                Admin balesin satu-satu, 2 orang tua sama-sama dijawab "bisa" buat jam 08.00 sama coach yang sama
                — ketauan bentroknya pas udah di kolam.
              </p>
            </div>
            <div className="rounded-xl bg-success-bg p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-success-text">Pakai sistem ini</p>
              <p className="mt-1.5 text-sm text-text-muted">
                Orang tua pertama yang klik "Booking" langsung ngunci slot itu. Orang tua kedua otomatis lihat
                status "Sudah dibooking" — gak perlu admin turun tangan sama sekali.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 peran -- nunjukin sistem lengkap dari 3 sisi. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Satu sistem, 3 peran</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Semua orang cuma lihat yang relevan
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-t-4 border-t-brand-500">
            <CardBody>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="swimmer" className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-text">Member (orang tua)</h3>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-text-muted">
                <li>Booking coach &amp; jam sendiri</li>
                <li>Pantau sisa sesi per anak</li>
                <li>Batalkan booking sendiri (dengan syarat)</li>
              </ul>
            </CardBody>
          </Card>
          <Card className="border-t-4 border-t-success-text">
            <CardBody>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg text-success-text">
                <Icon name="clipboardCheck" className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-text">Coach</h3>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-text-muted">
                <li>Buka slot jadwal sendiri</li>
                <li>Tandai kehadiran member</li>
                <li>Pantau jadwal coach lain</li>
              </ul>
            </CardBody>
          </Card>
          <Card className="border-t-4 border-t-accent-500">
            <CardBody>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Icon name="wrench" className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-text">Admin (Anda)</h3>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-text-muted">
                <li>Kelola semua akun &amp; peserta</li>
                <li>Pantau booking &amp; pembayaran</li>
                <li>Laporan kinerja coach otomatis</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Cara kerja -- 3 STEP besar, tiap step dikasih "mockup" kecil biar
          konkret (bukan cuma teks), gaya STEP 01/02/03-nya graphify. */}
      <section className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Cara kerja</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">Daftar → booking → beres</h2>
        </div>
        <div className="flex flex-col gap-4">
          {HOW_IT_WORKS.map((step, i) => (
            <Card key={step.title} className="overflow-hidden">
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                    Step {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold text-text">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-text-muted">{step.desc}</p>
                </div>
                <div className="flex w-full shrink-0 items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 font-mono text-xs sm:w-64">
                  <div>
                    <p className="text-text-subtle">{step.mockup.label}</p>
                    <p className="mt-0.5 font-semibold text-text">{step.mockup.value}</p>
                  </div>
                  <Badge tone="success">{step.mockup.status}</Badge>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimoni -- quote sama persis kayak yang udah ada & disetujui di
          halaman /panduan, bukan testimoni baru yang dikarang. */}
      <section className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="flex gap-4 rounded-2xl bg-brand-50 p-6 sm:p-8">
          <Icon name="quote" className="h-8 w-8 shrink-0 text-brand-600" />
          <p className="text-sm font-medium text-brand-700 sm:text-base">
            Sebelumnya: itung sisa sesi manual dari chat WA, sering ketuker antar anak, admin harus konfirmasi
            jadwal satu-satu. Sekarang: member booking sendiri, sisa sesi dan jatah pembatalan kehitung otomatis
            per anak, admin tinggal pantau.
          </p>
        </div>
      </section>

      {/* FAQ -- native <details>/<summary>, zero JS/dependency. */}
      <section className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Pertanyaan umum</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">Masih ragu?</h2>
        </div>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group rounded-xl border border-border bg-surface p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-text marker:content-none">
                {item.q}
                <span className="shrink-0 text-lg leading-none text-text-subtle transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-sm text-text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Pilih jalur -- fork eksplisit 2 audiens (pemilik vs orang tua),
          gantiin section "buat orang tua" yang tadinya sendirian & keliatan
          nyempil -- sekarang dua-duanya dikasih bobot yang sama. */}
      <section className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Pilih jalur Anda</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">Anda yang mana?</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border-t-4 border-t-brand-500">
            <CardBody className="flex flex-col items-start gap-3 py-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="wrench" className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-text">Punya kolam / tempat les</h3>
              <p className="text-sm text-text-muted">
                Mau kelola booking, jadwal coach, dan pembayaran tanpa ribet WA &amp; Excel? Ngobrol dulu soal
                kebutuhan tempat les Anda.
              </p>
              <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer">
                <Button>Hubungi Kami</Button>
              </a>
            </CardBody>
          </Card>
          <Card className="border-t-4 border-t-accent-500">
            <CardBody className="flex flex-col items-start gap-3 py-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Icon name="swimmer" className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-text">Anak mau les renang</h3>
              <p className="text-sm text-text-muted">
                Daftar akun, pilih coach dan jam yang cocok, bayar online — paket langsung aktif. Bisa daftarin
                lebih dari satu anak sekaligus.
              </p>
              <Link href="/register">
                <Button variant="secondary">Daftar Sekarang</Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* CTA band penutup */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-16">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-9 text-center text-white sm:px-10 sm:py-12">
          <h2 className="text-xl font-semibold sm:text-2xl">Siap dipakai hari ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
            Gak perlu training panjang — alurnya udah familiar kayak booking online pada umumnya. Coba dulu lewat
            akun demo, atau langsung ngobrol soal kebutuhan tempat les Anda.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="!bg-white !text-brand-700 hover:!bg-white/90">
                Hubungi Kami
              </Button>
            </a>
            <a href="/panduan">
              <Button variant="ghost" className="!text-white hover:!bg-white/10">
                Coba Akun Demo →
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-text-subtle">
        Les Renang Cianjur — sistem booking &amp; manajemen les renang.
      </footer>
    </main>
  );
}
