import { cloneElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
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

const roleToneClasses = {
  brand: { bg: "bg-brand-50", text: "text-brand-700" },
  accent: { bg: "bg-accent-50", text: "text-accent-600" },
  admin: { bg: "bg-brand-100", text: "text-brand-700" },
  coach: { bg: "bg-success-bg", text: "text-success-text" },
};

const OWNER_WA_LINK = buildOwnerInquiryWaLink();

export default function LandingView() {
  return (
    <main className="flex min-h-screen flex-col">
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

      {/* Hero -- pitch utama ke pemilik kolam/tempat les (audiens B2B),
          bukan ke orang tua. Section "buat orang tua" ada di bawah,
          terpisah & lebih ringkas, sesuai request Hadi. */}
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

      {/* Buat orang tua -- section sekunder, lebih ringkas, CTA daftar. */}
      <section className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card className="bg-brand-50/60">
          <CardBody className="flex flex-col items-center gap-3 py-8 text-center sm:py-10">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Buat orang tua</span>
            <h2 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">
              Anak mau les renang di sini?
            </h2>
            <p className="max-w-md text-sm text-text-muted">
              Daftar akun, pilih coach dan jam yang cocok, bayar online — paket langsung aktif. Bisa daftarin lebih
              dari satu anak sekaligus.
            </p>
            <Link href="/register">
              <Button>Daftar Sekarang</Button>
            </Link>
          </CardBody>
        </Card>
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
