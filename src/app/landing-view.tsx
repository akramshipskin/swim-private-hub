import { cloneElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { StatCounter } from "@/components/ui/stat-counter";
import { buildOwnerInquiryWaLink } from "@/lib/whatsapp";

const CARD_HOVER = "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

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
    icon: "swimmer",
    tone: "coach",
    title: "Coach bisa ngajar lintas kolam",
    desc: "Coach gak keiket 1 tempat — bisa terafiliasi ke beberapa kolam mitra sekaligus, buka jadwal beda-beda di tiap kolam.",
  },
  {
    icon: "lock",
    tone: "accent",
    title: "Slot terkunci otomatis, gak bisa dobel",
    desc: "1 coach cuma bisa punya 1 slot terbuka per jam di SELURUH kolam — sistem yang jaga, bukan diinget-inget manual.",
  },
  {
    icon: "family",
    tone: "brand",
    title: "Pilih kolam, baru pilih coach",
    desc: "Orang tua booking dari kolam paketnya sendiri. Kenal coach yang lagi ngajar di kolam lain? Ada halaman kontak langsungnya.",
  },
  {
    icon: "creditCard",
    tone: "admin",
    title: "Pembayaran online per kolam",
    desc: "Checkout langsung ke akun Midtrans kolam yang bersangkutan — transparan, bukan lewat rekening pihak lain.",
  },
  {
    icon: "barChart",
    tone: "coach",
    title: "Laporan komisi otomatis",
    desc: "Tiap kolam dapet rincian omzet & komisi yang jelas, bukan hitung-hitungan manual di akhir bulan.",
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
  "Coach bagus cuma bisa diakses lewat 1 kolam — mau ikut kemana coach-nya pindah, susah dilacak.",
  "Kolam yang lagi butuh coach tambahan gak tau harus cari kemana selain nunggu rekomendasi orang.",
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
    q: "Kolam saya udah punya harga paket sendiri, bisa tetap pakai?",
    a: "Bisa. Tiap kolam mitra atur katalog paket & harganya sendiri-sendiri — platform gak maksa 1 harga sama rata buat semua kolam.",
  },
  {
    q: "Gimana kalau member mau batalin booking mendadak?",
    a: "Ada jatah pembatalan mandiri per paket (bisa diatur), dengan syarat minimal beberapa jam sebelum jadwal. Kalau di luar itu atau jatah udah abis, member tetap bisa minta bantuan admin langsung lewat WhatsApp yang pesannya udah keisi otomatis.",
  },
  {
    q: "Pembayarannya lewat mana, uangnya ke siapa?",
    a: "Lewat payment gateway resmi (virtual account bank, QRIS, e-wallet, kartu), tapi duitnya langsung masuk ke akun kolam yang bersangkutan — platform gak pernah pegang atau nahan dana member.",
  },
  {
    q: "Coach bisa ngajar di lebih dari 1 kolam?",
    a: "Bisa, itu justru inti dari platform ini — coach terafiliasi ke berapa pun kolam mitra, buka jadwal masing-masing sesuai kolamnya, tanpa bisa kebentrok jam.",
  },
];

const OWNER_WA_LINK = buildOwnerInquiryWaLink();

type LandingStats = { poolCount: number; coachCount: number; memberCount: number };

export default function LandingView({ stats }: { stats: LandingStats }) {
  const STATS = [
    { value: stats.poolCount, label: "Kolam mitra" },
    { value: stats.coachCount, label: "Coach terdaftar" },
    { value: stats.memberCount, label: "Member terdaftar" },
    { value: 3, label: "Peran dalam 1 sistem" },
  ];

  return (
    // Landing page dipaku ke light theme regardless of OS/system dark mode
    // (sama pola kayak hero & CTA band di bawah -- "fixed 1 tampilan").
    // Card/Badge/Button pake token warna (bg-surface, text-text, dst) yang
    // biasanya ngikutin dark mode; tanpa pin ini, teks jadi nyaris gak
    // kebaca di atas bg cream pas viewer OS-nya dark mode.
    <main
      className="flex min-h-screen flex-col bg-[#F6F6EE] text-[#14140F]"
      style={
        {
          "--background": "#F6F6EE",
          "--foreground": "#14140F",
          "--color-brand-50": "#F1FBDD",
          "--color-brand-100": "#E3F5B0",
          "--color-brand-500": "#9FCC1F",
          "--color-brand-600": "#14140F",
          "--color-brand-700": "#14140F",
          "--color-accent-50": "#fff1f2",
          "--color-accent-100": "#ffe4e6",
          "--color-accent-500": "#f43f5e",
          "--color-accent-600": "#e11d48",
          "--color-surface": "#ffffff",
          "--color-surface-muted": "#ECE9DC",
          "--color-border": "#DEDACA",
          "--color-text": "#14140F",
          "--color-text-muted": "#5C5945",
          "--color-text-subtle": "#8B8770",
          "--color-success-bg": "#ecfdf5",
          "--color-success-text": "#047857",
          "--color-warning-bg": "#fffbeb",
          "--color-warning-text": "#b45309",
          "--color-danger-bg": "#fef2f2",
          "--color-danger-text": "#b91c1c",
          "--color-disabled-bg": "#cbd5e1",
          "--color-disabled-text": "#94a3b8",
        } as React.CSSProperties
      }
    >
      {/* Hero -- band gelap FIXED (bukan ikut tema light/dark, sama pola
          kayak CTA band di bawah) buat bikin statement kuat di atas fold,
          gaya "dark photo hero" yang direferensiin (run club Framer
          template). Foto STOCK generik (Pexels, free-to-use license,
          bukan kolam/coach/member beneran -- lihat Kredit Foto di
          footer), bukan gradient doang lagi. Overlay gradient di atasnya
          buat legibility teks + sentuhan warna brand (indigo/rose) biar
          gak lepas dari identitas visual sisa halaman. */}
      <div className="relative overflow-hidden bg-[#14140F]">
        {/* Blok visual hero -- dipaku min-h-screen (1 layar penuh, kayak
            reference) BUKAN auto-height. Foto di-zoom (scale) dikit biar
            ngisi frame penuh & kerasa immersive, bukan foto kecil ngambang
            di tengah ruang gelap kosong. */}
        <div className="relative flex min-h-screen flex-col">
          <Image
            src="/images/landing/hero-swim.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-125 object-cover object-[62%_45%] sm:scale-110"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(20,20,15,0.55) 0%, rgba(20,20,15,0.3) 30%, rgba(20,20,15,0.75) 72%, rgba(20,20,15,0.97) 100%), radial-gradient(circle at 85% 10%, rgba(244,63,94,0.18) 0%, transparent 45%), radial-gradient(circle at 10% 85%, rgba(198,255,61,0.22) 0%, transparent 45%)",
            }}
          />
          <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Swim Private Hub"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-contain"
                priority
              />
              <span className="font-semibold tracking-tight text-white">Swim Private Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] !rounded-full !text-white hover:!bg-white/10"
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="min-h-[44px] !rounded-full">
                  Daftar
                </Button>
              </Link>
            </div>
          </header>

          {/* Pitch utama, anchor ke BAWAH blok hero (mt-auto) -- sama kayak
              reference yang teksnya nempel bawah, ninggalin ruang foto
              kebuka di atas, bukan ke-center di tengah kotak pendek. Fork
              3 jalur ("Anda yang mana?") ada di section terpisah bawah. */}
          <section className="relative mx-auto mt-auto flex w-full max-w-3xl flex-col items-center px-4 pb-14 pt-6 text-center sm:pb-20 sm:pt-10">
          <Reveal eager>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
              Marketplace les renang privat
            </span>
          </Reveal>
          <Reveal eager delay={90}>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance text-white sm:text-6xl">
              Coach mana aja,
              <br />
              kolam mana aja.
            </h1>
          </Reveal>
          <Reveal eager delay={180}>
            <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
              Coach gak keiket 1 tempat, bisa ngajar di beberapa kolam mitra. Orang tua booking langsung, kolam
              manapun. Kolam dapet booking &amp; laporan komisi otomatis, tanpa ngurus tech sendiri.
            </p>
          </Reveal>
          <Reveal eager delay={270}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/daftar-kolam">
                <Button className="!rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]">
                  <Icon name="chat" className="h-4 w-4" />
                  Punya Kolam? Gabung Jaringan
                </Button>
              </Link>
              <Link href="/daftar-coach">
                <Button
                  variant="ghost"
                  className="!rounded-full !border !border-white/20 !text-white transition-transform hover:!bg-white/10 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Icon name="swimmer" className="h-4 w-4" />
                  Coach Renang? Daftar di Sini
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal eager delay={360}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {TRUST_PILLS.map((p) => (
                <span
                  key={p.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                  {p.label}
                </span>
              ))}
            </div>
          </Reveal>
          </section>
        </div>

        {/* Stats band -- angka ASLI dari DB (bukan angka rekaan kayak
            "500+ students" di template referensi), query di page.tsx.
            Wajar kecil karena masih pre-launch -- jujur lebih penting
            daripada keliatan "rame". Angka ngitung naik pas discroll ke
            sini (StatCounter) -- animasi doang, bukan angkanya dikarang. */}
        <section className="relative border-t border-white/10 px-4 py-10 sm:py-12">
          <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className="flex flex-col gap-1">
                  <span className="text-4xl font-bold tracking-tight tabular-nums text-white sm:text-5xl">
                    <StatCounter value={s.value} />
                  </span>
                  <span className="text-sm text-white/60">{s.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* Problem -- agitate dulu sebelum kasih solusi, pola sales page klasik. */}
      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:py-16">
        <Reveal>
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-accent-600">Kedengeran familiar?</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-text sm:text-5xl">
              Ngurus les renang manual, capeknya di mana-mana
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PAIN_POINTS.map((p, i) => (
            <Reveal key={p} delay={(i % 2) * 80}>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger-text">
                  <Icon name="cross" className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm text-text-muted">{p}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mx-auto mt-6 max-w-lg text-center text-sm font-medium text-text">
            Semua itu kejadian bukan karena Anda kurang teliti — tapi karena ngatur ini semua pake chat &amp; Excel
            emang gak dirancang buat scale.
          </p>
        </Reveal>
      </section>

      {/* Features -- framing buat pemilik/pengelola. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
        <Reveal>
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Kenapa ini beda</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-text sm:text-5xl">
              Dibangun buat masalah operasional nyata
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
              Bukan sistem booking generik — tiap fitur disesuaikan sama cara kerja les privat.
            </p>
          </div>
        </Reveal>
        <div className="mt-6 divide-y divide-border border-t border-border">
          {OWNER_FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={Math.min(i, 4) * 60}>
              <div className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[240px_1fr] sm:gap-8 sm:py-7">
                <div className={`flex items-center gap-2.5 ${roleToneClasses[f.tone].text}`}>
                  <Icon name={f.icon} className="h-5 w-5 shrink-0" />
                  <h3 className="text-sm font-semibold text-text">{f.title}</h3>
                </div>
                <p className="text-sm text-text-muted sm:pt-0.5">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Lihat Langsung -- rekreasi UI beneran (bukan screenshot file, tapi
          state persis yang barusan diverifikasi langsung di app produksi:
          Coach Ayu buka slot 10 Sep, 1 dibooking 1 masih kebuka) buat 3
          momen inti. Gantiin tabel perbandingan + kartu skenario teks --
          "liat produknya" lebih ngena daripada tabel klaim. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
        <Reveal>
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Lihat langsung</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-text sm:text-5xl">
              Bukan mockup, ini tampilan aslinya
            </h2>
          </div>
        </Reveal>
        {/* Sticky stacking cards -- sama persis mekanisme scroll di reference
            (schedule cards Stride template): tiap kartu `position: sticky`
            dengan `top` makin gede + z-index makin tinggi, jadi pas discroll
            kartu berikutnya nutupin kartu sebelumnya, nyisain sliver dikit
            di atas. CSS murni, nol JS/dependency. */}
        {/* Tiap kartu sticky butuh "runway" scroll ekstra biar keliatan
            numpuk (bukan cuma sticky doang tanpa ruang gerak) -- runway-nya
            WAJIB `margin-bottom` di kartu sticky itu sendiri, BUKAN
            `padding-bottom` di div wrapper terpisah. Udah diuji langsung:
            wrapper terpisah dengan padding-bottom bikin sticky-nya gagal
            nempel sama sekali (containing block-nya keliatan kehitung
            salah), sedangkan margin di elemen sticky-nya sendiri (sebagai
            flex child langsung, gak dibungkus div lain) beres. Div
            `sticky` juga WAJIB di LUAR `<Reveal>`, bukan sebaliknya --
            `Reveal` nyetel CSS `transform` (translate-y) buat animasi
            fade-nya, dan `transform` di ANCESTOR bikin containing-block
            baru buat descendant `position: sticky`. */}
        <div className="flex flex-col">
          <div className="sticky top-20 z-10 mb-16 flex flex-col rounded-2xl border border-border bg-surface shadow-xl sm:top-24 sm:mb-24 sm:min-h-[420px] sm:justify-center">
            <Reveal className="p-5 sm:p-8">
              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 01</span>
                  <h3 className="mt-1 text-lg font-semibold text-text">Slot kekunci begitu dibooking</h3>
                  <p className="mt-1.5 text-sm text-text-muted">
                    2 orang tua chat bareng nanya slot yang sama — baik lewat chat personal maupun grup WhatsApp.
                    Yang klik &quot;Booking&quot; duluan langsung ngunci slot itu. Yang lain otomatis lihat slot
                    udah kepake, gak perlu admin turun tangan misahin.
                  </p>
                </div>
                <BrowserFrame title="/member/booking">
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
            </Reveal>
          </div>

          <div className="sticky top-28 z-20 mb-16 flex flex-col rounded-2xl border border-border bg-surface shadow-xl sm:top-32 sm:mb-24 sm:min-h-[420px] sm:justify-center">
            <Reveal className="p-5 sm:p-8">
              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                <div className="sm:order-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 02</span>
                  <h3 className="mt-1 text-lg font-semibold text-text">Paket aktif otomatis abis bayar</h3>
                  <p className="mt-1.5 text-sm text-text-muted">
                    Gak ada lagi &quot;admin, udah dicek belum bayarannya?&quot;. Begitu pembayaran online
                    berhasil, status paket langsung berubah — sisa sesi siap dipakai booking hari itu juga.
                  </p>
                </div>
                <BrowserFrame title="/member/paket" className="sm:order-1">
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
            </Reveal>
          </div>

          <div className="sticky top-36 z-30 mb-16 flex flex-col rounded-2xl border border-border bg-surface shadow-xl sm:top-40 sm:mb-24 sm:min-h-[420px] sm:justify-center">
            <Reveal className="p-5 sm:p-8">
              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 03</span>
                  <h3 className="mt-1 text-lg font-semibold text-text">
                    Honor coach dari kehadiran, bukan tebakan
                  </h3>
                  <p className="mt-1.5 text-sm text-text-muted">
                    Coach tandai Hadir/Gak Hadir abis sesi selesai. Cuma sesi Hadir yang kehitung valid — Anda
                    tinggal buka laporan Kinerja Coach per rentang tanggal, gak perlu rekap manual dari catatan.
                  </p>
                </div>
                <BrowserFrame title="/coach/riwayat">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Riwayat Sesi
                  </p>
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
            </Reveal>
          </div>

          <div className="sticky top-44 z-40 flex flex-col rounded-2xl border border-border bg-surface shadow-xl sm:top-48 sm:min-h-[420px] sm:justify-center">
            <Reveal className="p-5 sm:p-8">
              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
                <div className="sm:order-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 04</span>
                  <h3 className="mt-1 text-lg font-semibold text-text">Coach yang sama, kolam beda-beda</h3>
                  <p className="mt-1.5 text-sm text-text-muted">
                    Kenal 1 coach dari kolam langganan, tapi dia lagi ngajar di kolam lain? Tinggal buka halaman
                    coach-nya, langsung keliatan kolam mana aja yang dia terafiliasi, plus kontak WA langsung.
                  </p>
                </div>
                <BrowserFrame title="/pelatih/coach-ayu" className="sm:order-1">
                  <p className="mb-2 text-lg font-semibold text-text">Coach Ayu</p>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Ngajar di kolam
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-sm font-medium text-text">Kolam Renang Melati</p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-sm font-medium text-text">Kolam Renang Tirta Asri</p>
                    </div>
                  </div>
                </BrowserFrame>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3 peran -- nunjukin sistem lengkap dari 3 sisi. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
        <Reveal>
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Satu sistem, 3 peran</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-text sm:text-5xl">
              Semua orang cuma lihat yang relevan
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Reveal delay={0}>
            <Card className={`border-t-4 border-t-brand-500 ${CARD_HOVER}`}>
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
          </Reveal>
          <Reveal delay={80}>
            <Card className={`border-t-4 border-t-success-text ${CARD_HOVER}`}>
              <CardBody>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg text-success-text">
                  <Icon name="clipboardCheck" className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-text">Coach</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-text-muted">
                  <li>Terafiliasi ke beberapa kolam sekaligus</li>
                  <li>Buka slot jadwal per kolam</li>
                  <li>Tandai kehadiran member</li>
                </ul>
              </CardBody>
            </Card>
          </Reveal>
          <Reveal delay={160}>
            <Card className={`border-t-4 border-t-accent-500 ${CARD_HOVER}`}>
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
          </Reveal>
        </div>
      </section>


      {/* FAQ -- native <details>/<summary>, zero JS/dependency. */}
      <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
        <Reveal>
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Pertanyaan umum</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-text sm:text-5xl">
              Masih ragu?
            </h2>
          </div>
        </Reveal>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <Reveal key={item.q} delay={Math.min(i, 4) * 50}>
              <details className="group rounded-xl border border-border bg-surface p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-text marker:content-none">
                  {item.q}
                  <span className="shrink-0 text-lg leading-none text-text-subtle transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2.5 text-sm text-text-muted">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pilih jalur -- fork eksplisit 3 audiens (kolam, coach, orang tua),
          bukan 2 kayak versi single-pool sebelumnya -- marketplace ini
          punya 3 sisi, jadi 3 kartu bobot yang sama, bukan salah satu
          dianggap sampingan. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
        <Reveal>
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Pilih jalur Anda</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-text sm:text-5xl">
              Anda yang mana?
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Reveal delay={0}>
            <Card className={`border-t-4 border-t-brand-500 ${CARD_HOVER}`}>
              <CardBody className="flex flex-col items-start gap-3 py-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name="wrench" className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-text">Punya kolam / tempat les</h3>
                <p className="text-sm text-text-muted">
                  Gabung jadi kolam mitra — dapet booking dari jaringan coach yang lebih luas, laporan komisi
                  otomatis, tanpa ngurus tech sendiri.
                </p>
                <Link href="/daftar-kolam">
                  <Button className="!rounded-full">Daftar Kolam</Button>
                </Link>
              </CardBody>
            </Card>
          </Reveal>
          <Reveal delay={80}>
            <Card className={`border-t-4 border-t-success-text ${CARD_HOVER}`}>
              <CardBody className="flex flex-col items-start gap-3 py-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg text-success-text">
                  <Icon name="clipboardCheck" className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-text">Coach renang</h3>
                <p className="text-sm text-text-muted">
                  Ngajar di lebih dari 1 kolam mitra, atur jadwal sendiri per kolam, jangkauan murid lebih luas
                  dari 1 tempat doang.
                </p>
                <Link href="/daftar-coach">
                  <Button variant="secondary" className="!rounded-full">
                    Gabung Jadi Coach
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </Reveal>
          <Reveal delay={160}>
            <Card className={`border-t-4 border-t-accent-500 ${CARD_HOVER}`}>
              <CardBody className="flex flex-col items-start gap-3 py-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <Icon name="swimmer" className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-text">Anak mau les renang</h3>
                <p className="text-sm text-text-muted">
                  Daftar akun, pilih kolam dan coach yang cocok, bayar online — paket langsung aktif. Bisa
                  daftarin lebih dari satu anak sekaligus.
                </p>
                <Link href="/register">
                  <Button variant="secondary" className="!rounded-full">
                    Daftar Sekarang
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* CTA band penutup -- gradient & warna teks tombol dipaku pake hex
          literal (bukan token brand-700), soalnya brand-700 sengaja
          "dibalik" jadi lime terang di dark mode (buat teks di atas
          surface gelap) -- dipake sebagai warna BACKGROUND/teks di sini
          malah bikin band nyala lime & tombol putih teksnya nyaris gak
          kebaca. Band ini sengaja fixed 1 tampilan di kedua tema. */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-16">
        <Reveal>
          <div className="rounded-2xl bg-gradient-to-br from-[#14140F] to-[#0a0a08] px-6 py-9 text-center text-white sm:px-10 sm:py-12">
            <h2 className="text-xl font-semibold sm:text-2xl">Siap dipakai hari ini</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
              Gak perlu training panjang — alurnya udah familiar kayak booking online pada umumnya. Coba dulu
              lewat akun demo, atau langsung ngobrol soal gabung sebagai kolam mitra.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="secondary"
                  className="!rounded-full !bg-[#C6FF3D] !text-[#14140F] transition-transform hover:!bg-[#D9FF7A] hover:scale-[1.03] active:scale-[0.98]"
                >
                  Hubungi Kami
                </Button>
              </a>
              <a href="/panduan">
                <Button
                  variant="ghost"
                  className="!rounded-full !text-white transition-transform hover:!bg-white/10 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Coba Akun Demo →
                </Button>
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 text-xs text-text-subtle sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-medium text-text-muted">Swim Private Hub</p>
            <p className="mt-1">[ALAMAT]</p>
            <p className="mt-1">
              WhatsApp{" "}
              <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 hover:underline">
                +62 821-1717-3124
              </a>{" "}
              · Email{" "}
              <a href="mailto:cianjurmarketers@gmail.com" className="hover:text-brand-600 hover:underline">
                cianjurmarketers@gmail.com
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:items-end">
            <Link href="/kebijakan-privasi" className="hover:text-brand-600 hover:underline">
              Kebijakan Privasi
            </Link>
            <Link href="/syarat-ketentuan" className="hover:text-brand-600 hover:underline">
              Syarat &amp; Ketentuan
            </Link>
            <Link href="/kebijakan-pengembalian" className="hover:text-brand-600 hover:underline">
              Kebijakan Pengembalian
            </Link>
            <Link href="/kebijakan-cookie" className="hover:text-brand-600 hover:underline">
              Kebijakan Cookie
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-text-subtle">
          © 2026 Swim Private Hub — marketplace les renang privat. Foto hero: stok (Pexels, bebas komersial), bukan
          member/kolam sungguhan.
        </p>
      </footer>
    </main>
  );
}
