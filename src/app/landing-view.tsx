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

// Bingkai "browser" buat rekreasi UI beneran di section "Lihat Langsung" --
// bukan screenshot file, tapi state persis yang udah diverifikasi langsung
// di app produksi. Pake Card/Badge/Button yang sama kayak UI aslinya biar
// akurat, bukan didesain ulang biar "lebih bagus".
function BrowserFrame({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-lg ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger-text/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning-text/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-success-text/30" />
        <span className="ml-2 truncate text-[11px] text-text-subtle">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
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
      {/* Hero -- kembali ke palet terang standar aplikasi (bg-background +
          gradient brand-100 yang sama kayak body di globals.css), gaya
          graphify (dark band) di-cancel per feedback Hadi. */}
      <div>
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Les Renang Cianjur"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
              priority
            />
            <span className="font-semibold tracking-tight text-text">Les Renang Cianjur</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar</Button>
            </Link>
          </div>
        </header>

        {/* Pitch utama ke pemilik kolam/tempat les (audiens B2B), bukan ke
            orang tua -- fork "Anda yang mana?" ada di bawah. */}
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-10 pt-8 text-center sm:pt-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted shadow-sm">
            Sistem booking &amp; manajemen les renang
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance text-text sm:text-5xl">
            Kelola les renang tanpa <span className="text-brand-600">bolak-balik chat WhatsApp</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-text-muted sm:text-lg">
            Jadwal bentrok, sisa sesi dihitung manual dari chat, lupa siapa yang udah bayar — sistem ini beresin
            semuanya. Member booking sendiri, coach kelola jadwal sendiri, Anda tinggal pantau dari satu dashboard.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer">
              <Button>
                <Icon name="chat" className="h-4 w-4" />
                Punya Kolam Renang? Hubungi Kami
              </Button>
            </a>
            <a href="/panduan">
              <Button variant="secondary">Lihat Demo &amp; Fitur Lengkap</Button>
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {TRUST_PILLS.map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted shadow-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
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

      {/* Lihat Langsung -- rekreasi UI beneran (bukan screenshot file, tapi
          state persis yang barusan diverifikasi langsung di app produksi:
          Coach Ayu buka slot 10 Sep, 1 dibooking 1 masih kebuka) buat 3
          momen inti. Gantiin tabel perbandingan + kartu skenario teks --
          "liat produknya" lebih ngena daripada tabel klaim. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Lihat langsung</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Bukan mockup, ini tampilan aslinya
          </h2>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 01</span>
              <h3 className="mt-1 text-lg font-semibold text-text">Slot kekunci begitu dibooking</h3>
              <p className="mt-1.5 text-sm text-text-muted">
                2 orang tua chat bareng nanya slot yang sama — baik lewat chat personal maupun grup WhatsApp. Yang
                klik "Booking" duluan langsung ngunci slot itu. Yang lain otomatis lihat slot udah kepake, gak
                perlu admin turun tangan misahin.
              </p>
            </div>
            <BrowserFrame title="lesrenangcianjur.vercel.app/member/booking">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                  CA
                </span>
                <span className="text-sm font-semibold text-text">Coach Ayu</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-text">08.00–09.00</p>
                    <p className="text-xs text-text-subtle">buat kamu sendiri</p>
                  </div>
                  <span className="rounded-lg border border-danger-text/25 px-2.5 py-1 text-xs font-medium text-danger-text">
                    Batalkan
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-text">09.00–10.00</p>
                  <Button size="sm">Booking</Button>
                </div>
              </div>
              <p className="mt-3 rounded-lg bg-success-bg px-3 py-2 text-xs font-medium text-success-text">
                Booking berhasil! Cek di halaman Riwayat.
              </p>
            </BrowserFrame>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
            <div className="sm:order-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 02</span>
              <h3 className="mt-1 text-lg font-semibold text-text">Paket aktif otomatis abis bayar</h3>
              <p className="mt-1.5 text-sm text-text-muted">
                Gak ada lagi "admin, udah dicek belum bayarannya?". Begitu pembayaran online berhasil, status paket
                langsung berubah — sisa sesi siap dipakai booking hari itu juga.
              </p>
            </div>
            <BrowserFrame title="lesrenangcianjur.vercel.app/member/paket" className="sm:order-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">Paket Saya</p>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-text">Private | 8x Renang</p>
                  <p className="text-xs text-text-subtle">buat Ucok · Sisa sesi 8/8</p>
                </div>
                <Badge tone="success">Aktif</Badge>
              </div>
            </BrowserFrame>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 03</span>
              <h3 className="mt-1 text-lg font-semibold text-text">Honor coach dari kehadiran, bukan tebakan</h3>
              <p className="mt-1.5 text-sm text-text-muted">
                Coach tandai Hadir/Gak Hadir abis sesi selesai. Cuma sesi Hadir yang kehitung valid — Anda tinggal
                buka laporan Kinerja Coach per rentang tanggal, gak perlu rekap manual dari catatan.
              </p>
            </div>
            <BrowserFrame title="lesrenangcianjur.vercel.app/coach/riwayat">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">Riwayat Sesi</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <p className="text-sm text-text">Ucok · 08.00–09.00</p>
                  <Badge tone="success">Hadir</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <p className="text-sm text-text">Rina · 09.00–10.00</p>
                  <Badge tone="neutral">Belum ditandai</Badge>
                </div>
              </div>
            </BrowserFrame>
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
