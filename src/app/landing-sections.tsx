import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

// Section jualan landing (blind spot 26 Sep, diputuskan Hadi 29 Sep): satu
// section per peran + pilih peran + dulu-vs-sekarang. Semua klaim bersumber
// dari sistem yang LIVE dan Syarat & Ketentuan; tanpa angka komisi dan tanpa
// janji jumlah murid/pelanggan.
//
// Tata letak (redesain 1 Okt): tiap section memakai keluarga tata letak yang
// berbeda supaya halaman tidak terasa seperti satu template yang diulang:
//   pilih peran  = baris editorial bergaris
//   dulu-sekarang = tabel perbandingan
//   orang tua    = teks + tampilan HP bertumpuk
//   coach        = bento dengan sel bervariasi (lime, foto, gelap)
//   pemilik kolam = tiga kelompok berjudul (tanpa kartu)
// Bagian Kolam mitra dan Kenalan dengan coach TIDAK diubah (keputusan Hadi).

type Point = { title: string; body: string };

const ROLES = [
  {
    href: "#orang-tua",
    label: "Orang tua / peserta",
    line: "Cari coach renang yang pas untuk anakmu, atau untuk dirimu sendiri.",
    cta: "Lihat untuk orang tua",
  },
  {
    href: "#untuk-coach",
    label: "Coach",
    line: "Jadwal, kehadiran, dan saldo diurus sistem. Kamu fokus mengajar.",
    cta: "Lihat untuk coach",
  },
  {
    href: "#untuk-kolam",
    label: "Pemilik kolam",
    line: "Ubah jam sepi kolam jadi les privat yang terjadwal, dengan bagi hasil yang jelas.",
    cta: "Lihat untuk pemilik kolam",
  },
];

// Tiga baris besar yang bisa diklik. Orang tua (pengguna terbanyak) tampil
// paling menonjol lewat teks lebih besar, bukan lewat kartu berwarna.
export function RolePicker() {
  return (
    <section aria-labelledby="pilih-peran" className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
      <h2 id="pilih-peran" className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        Kamu di sini sebagai apa?
      </h2>
      <ul className="mt-8 border-y border-fixed-ink/15 sm:mt-10">
        {ROLES.map((r, i) => (
          <li key={r.href} className={i > 0 ? "border-t border-fixed-ink/15" : ""}>
            <a
              href={r.href}
              className="group grid gap-2 py-6 transition-colors hover:bg-fixed-lime-50 md:grid-cols-[13rem_minmax(0,1fr)_auto] md:items-center md:gap-8 md:px-4 md:py-8"
            >
              <span className="text-sm font-semibold text-fixed-muted">{r.label}</span>
              <span className={`font-semibold leading-snug text-balance ${i === 0 ? "text-2xl md:text-4xl" : "text-xl md:text-3xl"}`}>{r.line}</span>
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold underline decoration-fixed-ink/30 underline-offset-4 md:mt-0 md:no-underline">
                {r.cta}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-fixed-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-fixed-ink underline underline-offset-4">Masuk</Link>
      </p>
    </section>
  );
}

// Tiap baris memasangkan satu kebiasaan lama dengan penggantinya di aplikasi.
const COMPARE = [
  {
    before: "Tanya jadwal kosong lewat WhatsApp, lalu menunggu balasan.",
    after: "Pilih coach, kolam, dan jam yang masih kosong. Slot yang sudah diambil otomatis terkunci.",
  },
  {
    before: "Transfer manual, kirim bukti, menunggu dikonfirmasi.",
    after: "Bayar online (virtual account, QRIS, e-wallet, kartu). Paket aktif otomatis.",
  },
  {
    before: "Mencatat sendiri sudah les berapa kali dan tersisa berapa.",
    after: "Sisa sesi terhitung otomatis, per peserta.",
  },
  {
    before: "Tidak ada catatan perkembangan yang rapi.",
    after: "Coach mencatat perkembangan anak, dan kamu bisa melihatnya kapan saja.",
  },
];

export function BeforeAfter() {
  return (
    <section aria-labelledby="dulu-sekarang" className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="lg:pt-2">
          <h2 id="dulu-sekarang" className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Les renang tanpa drama chat.
          </h2>
          <p className="mt-4 max-w-md text-base text-fixed-muted">Empat hal yang dulu diurus lewat chat, sekarang diurus aplikasi.</p>
          <Link href="/register" className="mt-7 inline-flex items-center rounded-full bg-fixed-ink px-6 py-3 text-base font-semibold text-white transition-transform hover:bg-fixed-ink-deep active:scale-[0.98]">
            Daftar gratis
          </Link>
        </div>
        <div className="overflow-hidden rounded-3xl bg-white">
          <div className="grid grid-cols-2 text-xs font-semibold">
            <p className="bg-fixed-sand px-5 py-3 text-fixed-muted sm:px-7">Cara lama</p>
            <p className="bg-fixed-ink px-5 py-3 text-fixed-lime sm:px-7">Di Swim Private Hub</p>
          </div>
          <ul>
            {COMPARE.map((row, i) => (
              <li key={row.before} className={`grid grid-cols-2 ${i > 0 ? "border-t border-fixed-ink/10" : ""}`}>
                <p className="px-5 py-5 text-sm text-fixed-muted sm:px-7 sm:text-base">{row.before}</p>
                <p className="border-l border-fixed-ink/10 bg-fixed-lime-50 px-5 py-5 text-sm font-medium text-fixed-ink sm:px-7 sm:text-base">{row.after}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const PARENT_POINTS: Point[] = [
  {
    title: "Harga paket sudah termasuk tiket masuk kolam",
    body: "Peserta tidak membayar tiket lagi di loket. Pendamping yang tidak berenang juga tidak dikenakan tiket.",
  },
  {
    title: "Benar-benar privat: 1 coach, 1 anak",
    body: "Setiap sesi berlangsung 60 menit dan dijadwalkan khusus untuk anakmu. Bukan kelas gabungan.",
  },
  {
    title: "Kamu yang memilih coach",
    body: "Lihat keahlian, umur, dan kolam tempat mengajar. Badge Bersertifikat berarti sertifikat yang diunggah coach sudah diperiksa dan disetujui admin.",
  },
  {
    title: "Perkembangan anak tercatat",
    body: "Coach mencatat kemampuan yang sudah dikuasai, dari mengapung sampai gaya bebas. Kamu bisa melihatnya kapan saja, dan anak mendapat sertifikat setiap naik level.",
  },
  {
    title: "Keselamatan kolam jelas penanggung jawabnya",
    body: "Kolam mitra bertanggung jawab atas petugas penyelamat selama jam operasional, perlengkapan P3K, rambu kedalaman, dan kebersihan air.",
  },
  {
    title: "Boleh coba dulu",
    body: "Belum yakin? Kolam yang menyediakan paket coba 1 sesi menampilkannya di katalog untuk peserta yang belum pernah punya paket.",
  },
];

const SHOTS = [
  { src: "/images/landing/produk-cari-coach.png", caption: "Cari coach: keahlian, badge, dan kolam mengajar" },
  { src: "/images/landing/produk-booking.png", caption: "Booking: pilih jam yang masih kosong" },
  { src: "/images/landing/produk-milestone.png", caption: "Perkembangan anak: butir yang sudah dikuasai" },
];

const PHONE_SHADOW = "shadow-[0_30px_60px_-24px_rgba(20,20,15,0.45)]";

export function ParentSection() {
  return (
    <section id="orang-tua" className="scroll-mt-36 md:scroll-mt-20 bg-fixed-sand py-14 sm:py-20">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
        <div className="min-w-0">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Anak belajar dengan tenang. Kamu tahu persis apa yang dibayar.
          </h2>
          <p className="mt-4 max-w-xl text-base text-fixed-muted">Tanpa biaya tersembunyi, tanpa kejutan di kolam.</p>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {PARENT_POINTS.map((p) => (
              <li key={p.title} className="border-t border-fixed-ink/20 pt-5">
                <h3 className="text-lg font-semibold leading-snug">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fixed-ink-soft">{p.body}</p>
              </li>
            ))}
          </ul>
          <Link href="/register" className="mt-10 inline-flex items-center rounded-full bg-fixed-ink px-6 py-3 text-base font-semibold text-white transition-transform hover:bg-fixed-ink-deep active:scale-[0.98]">
            Daftar gratis
          </Link>
        </div>

        {/* Tampilan HP asli aplikasi (data contoh). HP: digeser ke samping;
            layar lebar: tiga layar bertumpuk, yang tengah paling depan. */}
        <div className="min-w-0 lg:pt-4">
          <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] lg:relative lg:mx-0 lg:block lg:h-[38rem] lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {SHOTS.map((s, i) => (
              <li
                key={s.src}
                className={`w-[210px] shrink-0 snap-center lg:absolute lg:w-[12.5rem] ${
                  i === 0 ? "lg:left-0 lg:top-24" : i === 1 ? "lg:left-[9.25rem] lg:top-0 lg:z-10" : "lg:left-[18.5rem] lg:top-40"
                }`}
              >
                <Image
                  src={s.src}
                  alt={s.caption}
                  width={390}
                  height={844}
                  className={`w-full rounded-[2rem] border border-fixed-ink/10 ${PHONE_SHADOW}`}
                />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-fixed-muted">Contoh tampilan dengan data contoh: cari coach, booking jam, dan perkembangan anak.</p>
        </div>
      </div>
    </section>
  );
}

const COACH_CELLS: { title: string; body: string }[] = [
  {
    title: "Peserta tidak datang, kamu tetap dibayar",
    body: "Peserta sudah booking tapi tidak datang? Kamu tetap mendapat 50% dari bagianmu untuk sesi itu.",
  },
  {
    title: "Jadwal, kehadiran, dan saldo otomatis",
    body: "Buka jam kosong per kolam, tandai kehadiran, dan saldomu langsung bertambah. Tidak ada tagih-menagih.",
  },
  {
    title: "Tanpa biaya masuk kolam",
    body: "Tiket masuk kolam untuk mengajar tidak ditagihkan kepadamu.",
  },
  {
    title: "Ajak peserta sendiri",
    body: "Setiap coach punya kode afiliasi. Member yang mendaftar memakai kodemu tercatat sebagai rujukanmu, dan kamu mendapat komisi afiliasi dari bagian SPH, bukan dari member.",
  },
  {
    title: "Kredensialmu tampil profesional",
    body: "Unggah beberapa sertifikat dan tampil dengan badge Bersertifikat setelah diperiksa admin. Peserta yang naik level mendapat sertifikat bertanda tanganmu.",
  },
  {
    title: "Semua pihak melihat angka yang sama",
    body: "Bagianmu dari setiap sesi tercatat jelas. Pencairan diproses manual oleh admin, secepatnya, dan statusnya terlihat.",
  },
];

// Enam sel persis untuk enam poin: satu sel lime besar (poin yang paling
// menentukan bagi coach), satu sel foto, satu sel gelap berbingkai, tiga sel
// gelap biasa. Bukan enam kartu kembar.
export function CoachSection() {
  const [lead, schedule, free, ...rest] = COACH_CELLS;
  return (
    <section id="untuk-coach" className="scroll-mt-36 md:scroll-mt-20 bg-fixed-ink py-14 text-white sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4">
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Kamu fokus mengajar. Sisanya diurus sistem.
        </h2>
        <p className="mt-4 max-w-2xl text-base text-white/75">
          Kami tidak menjanjikan peserta instan. Member memilih coach dari profilnya, jadi makin lengkap keahlian,
          sertifikat, dan jadwalmu, makin besar peluang kamu dipilih.
        </p>

        <div className="mt-10 grid gap-3 lg:grid-cols-6">
          <Reveal className="lg:col-span-3 lg:row-span-2">
            <div className="flex h-full min-h-72 flex-col justify-between gap-8 rounded-3xl bg-fixed-lime p-7 text-fixed-ink sm:p-9">
              <p className="text-7xl font-semibold leading-none tracking-tight sm:text-8xl">50%</p>
              <div>
                <h3 className="text-2xl font-semibold leading-snug text-balance sm:text-3xl">{lead.title}</h3>
                <p className="mt-3 max-w-md text-base text-fixed-ink-soft">{lead.body}</p>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={80}>
            <div className="relative isolate flex h-full min-h-56 flex-col justify-end overflow-hidden rounded-3xl p-7">
              <Image src="/images/landing/hero-swim.jpg" alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="-z-10 object-cover object-[60%_30%]" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
              <h3 className="text-xl font-semibold leading-snug">{schedule.title}</h3>
              <p className="mt-2 max-w-md text-sm text-white/85">{schedule.body}</p>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={140}>
            <div className="h-full rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/25">
              <h3 className="text-xl font-semibold leading-snug">{free.title}</h3>
              <p className="mt-2 max-w-md text-sm text-white/75">{free.body}</p>
            </div>
          </Reveal>

          {rest.map((c, i) => (
            <Reveal key={c.title} className="lg:col-span-2" delay={200 + i * 60}>
              <div className="h-full rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/15">
                <h3 className="text-lg font-semibold leading-snug">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-sm text-white/70">
          Satu kewajiban yang perlu kamu tahu: mulai 1 Oktober 2026, catatan perkembangan peserta diisi setiap 2 sesi
          Hadir.
        </p>
        <Link href="/daftar-coach" className="mt-6 inline-flex items-center rounded-full bg-fixed-lime px-6 py-3 text-base font-semibold text-fixed-ink transition-transform hover:bg-fixed-lime-100 active:scale-[0.98]">
          Daftar jadi coach
        </Link>
      </div>
    </section>
  );
}

// Enam poin dikelompokkan menurut yang dicari pemilik kolam: uang, paket dan
// harga, lalu pembagian kerja. Pengelompokan itu isinya, bukan hiasan.
const POOL_GROUPS: { heading: string; items: Point[] }[] = [
  {
    heading: "Uang",
    items: [
      {
        title: "Gabung gratis",
        body: "Tanpa biaya pendaftaran maupun biaya bulanan. Platform hanya mengambil komisi dari sesi yang terlaksana.",
      },
      {
        title: "Bagi hasil setiap sesi Hadir",
        body: "Bagian kolam masuk ke saldo otomatis setiap sesi ditandai Hadir, dan semua pihak melihat angka yang sama.",
      },
    ],
  },
  {
    heading: "Paket dan harga",
    items: [
      {
        title: "Kamu yang menentukan paket dan harga",
        body: "Usulkan paket dan harga untuk kolammu. Berlaku setelah diperiksa admin, paling lambat 1×24 jam.",
      },
      {
        title: "Tiket peserta sudah tercakup",
        body: "Tiket masuk peserta tercakup di bagian kolam dari harga paket, jadi tidak ada penagihan terpisah di loket.",
      },
    ],
  },
  {
    heading: "Kerja sama",
    items: [
      {
        title: "Ajak member sendiri",
        body: "Kolam punya kode afiliasi. Member yang mendaftar memakai kode kolammu tercatat sebagai rujukan kolam, dan kolam mendapat komisi afiliasi dari bagian SPH.",
      },
      {
        title: "Pembagian tanggung jawab jelas",
        body: "Kolam menjaga keselamatan fasilitas, coach bertanggung jawab atas pengajaran, SPH mengurus pemesanan dan pembayaran.",
      },
    ],
  },
];

export function PoolSection({ waLink }: { waLink: string }) {
  return (
    <section id="untuk-kolam" className="scroll-mt-36 md:scroll-mt-20 mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
      <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        Jam sepi kolammu, jadi les privat yang terjadwal.
      </h2>
      <p className="mt-4 max-w-2xl text-base text-fixed-muted">
        Kolam tetap kolam umum. Les privat mengisi jam kosong tanpa kamu mengurus coach atau pembayaran. SPH
        memperkenalkan kolammu kepada orang tua yang mencari les renang di aplikasi, tanpa menjanjikan jumlah member.
      </p>

      <div className="mt-12 grid gap-x-14 gap-y-12 md:grid-cols-3">
        {POOL_GROUPS.map((g) => (
          <div key={g.heading}>
            <h3 className="border-b-2 border-fixed-ink pb-3 text-xl font-semibold">{g.heading}</h3>
            <ul className="mt-2 divide-y divide-fixed-ink/10">
              {g.items.map((p) => (
                <li key={p.title} className="py-5">
                  <h4 className="text-base font-semibold leading-snug">{p.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-fixed-ink-soft">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/daftar-kolam" className="inline-flex items-center rounded-full bg-fixed-ink px-6 py-3 text-base font-semibold text-white transition-transform hover:bg-fixed-ink-deep active:scale-[0.98]">
          Daftarkan kolam
        </Link>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-fixed-ink/25 px-6 py-3 text-base font-semibold transition-colors hover:bg-white">
          Tanya lewat WhatsApp
        </a>
      </div>
    </section>
  );
}
