import Image from "next/image";
import Link from "next/link";

// Section jualan landing (blind spot 26 Sep, diputuskan Hadi 29 Sep): satu
// section per peran + pilih peran + dulu-vs-sekarang. Semua klaim bersumber
// dari sistem yang LIVE dan Syarat & Ketentuan; tanpa angka komisi dan tanpa
// janji jumlah murid/pelanggan.

type Point = { title: string; body: string };

// Enam poin ditata sebagai daftar bergaris (3 kolom di layar lebar, 2 di
// tablet, 1 di HP), bukan enam kartu berbagai ukuran: dulu sel lebar dan sempit
// bercampur sehingga banyak ruang kosong dan halaman terasa seperti tumpukan kartu.
function PointGrid({ points, dark = false }: { points: Point[]; dark?: boolean }) {
  return (
    <ul className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {points.map((p) => (
        <li key={p.title} className={`border-t pt-5 ${dark ? "border-white/25" : "border-fixed-ink/20"}`}>
          <h3 className={`text-lg font-semibold ${dark ? "text-white" : "text-fixed-ink"}`}>{p.title}</h3>
          <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-white/75" : "text-fixed-ink-soft"}`}>{p.body}</p>
        </li>
      ))}
    </ul>
  );
}

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

export function RolePicker() {
  return (
    <section aria-labelledby="pilih-peran" className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <h2 id="pilih-peran" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:max-w-md">
        Kamu di sini sebagai apa?
      </h2>
      {/* Kartu pertama (orang tua = pengguna terbanyak) jadi kartu besar, dua
          lainnya bertumpuk di sampingnya -- bukan tiga kartu kembar. */}
      <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5 md:grid-rows-2">
        {ROLES.map((r, i) => {
          const lead = i === 0;
          return (
            <li key={r.href} className={lead ? "md:col-span-3 md:row-span-2" : "md:col-span-2"}>
              <a
                href={r.href}
                className={`flex h-full flex-col justify-between gap-6 rounded-3xl transition-colors ${
                  lead ? "bg-fixed-lime-100 p-7 hover:brightness-95 md:p-10" : "bg-white p-7 hover:bg-fixed-lime-50"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-fixed-muted">{r.label}</p>
                  <p className={`mt-2 font-semibold leading-snug ${lead ? "text-2xl md:max-w-md md:text-4xl" : "text-xl"}`}>{r.line}</p>
                </div>
                <span className="text-sm font-semibold underline">{r.cta} →</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const BEFORE = [
  "Tanya jadwal kosong lewat WhatsApp, lalu menunggu balasan.",
  "Transfer manual, kirim bukti, menunggu dikonfirmasi.",
  "Mencatat sendiri sudah les berapa kali dan tersisa berapa.",
  "Tidak ada catatan perkembangan yang rapi.",
];
const AFTER = [
  "Pilih coach, kolam, dan jam yang masih kosong. Slot yang sudah diambil otomatis terkunci.",
  "Bayar online (virtual account, QRIS, e-wallet, kartu). Paket aktif otomatis.",
  "Sisa sesi terhitung otomatis, per peserta.",
  "Coach mencatat perkembangan anak, dan kamu bisa melihatnya kapan saja.",
];

export function BeforeAfter() {
  return (
    <section aria-labelledby="dulu-sekarang" className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-16">
      <h2 id="dulu-sekarang" className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        Les renang tanpa drama chat.
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-fixed-sand p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-fixed-muted">Cara lama</p>
          <ul className="mt-4 flex flex-col gap-3">
            {BEFORE.map((t) => (
              <li key={t} className="flex gap-3 text-base text-fixed-ink-soft">
                <span aria-hidden="true" className="mt-0.5 text-fixed-muted">✕</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-fixed-ink p-7 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-fixed-lime">Di Swim Private Hub</p>
          <ul className="mt-4 flex flex-col gap-3">
            {AFTER.map((t) => (
              <li key={t} className="flex gap-3 text-base text-white/90">
                <span aria-hidden="true" className="mt-0.5 text-fixed-lime">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link href="/register" className="inline-block rounded-full bg-fixed-ink px-6 py-3 text-base font-semibold text-white hover:bg-fixed-ink-deep">
          Daftar gratis
        </Link>
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

export function ParentSection() {
  return (
    <section id="orang-tua" className="scroll-mt-36 md:scroll-mt-20 bg-fixed-sand py-14 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-fixed-muted">Untuk orang tua / peserta</p>
          <h2 className="mx-auto mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Anak belajar dengan tenang. Kamu tahu persis apa yang dibayar.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-fixed-muted">Tanpa biaya tersembunyi, tanpa kejutan di kolam.</p>
        </div>
        <PointGrid points={PARENT_POINTS} />

        <h3 className="mt-16 text-center text-2xl font-semibold tracking-tight">Seperti ini tampilannya di HP</h3>
        <ul className="mt-8 flex snap-x gap-5 overflow-x-auto pb-4 md:justify-center">
          {SHOTS.map((s) => (
            <li key={s.src} className="w-[220px] shrink-0 snap-center">
              <Image
                src={s.src}
                alt={s.caption}
                width={390}
                height={844}
                className="w-full rounded-3xl border border-fixed-ink/10 shadow-lg"
              />
              <p className="mt-3 text-center text-sm text-fixed-muted">{s.caption}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-center text-xs text-fixed-muted">Contoh tampilan dengan data contoh.</p>

        <div className="mt-10 text-center">
          <Link href="/register" className="inline-block rounded-full bg-fixed-ink px-6 py-3 text-base font-semibold text-white hover:bg-fixed-ink-deep">
            Daftar gratis
          </Link>
        </div>
      </div>
    </section>
  );
}

const COACH_POINTS: Point[] = [
  {
    title: "Jadwal, kehadiran, dan saldo otomatis",
    body: "Buka jam kosong per kolam, tandai kehadiran, dan saldomu langsung bertambah. Tidak ada tagih-menagih.",
  },
  {
    title: "Tanpa biaya masuk kolam",
    body: "Tiket masuk kolam untuk mengajar tidak ditagihkan kepadamu.",
  },
  {
    title: "Peserta tidak datang, kamu tetap dibayar",
    body: "Peserta sudah booking tapi tidak datang? Kamu tetap mendapat 50% dari bagianmu untuk sesi itu.",
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

export function CoachSection() {
  return (
    <section id="untuk-coach" className="scroll-mt-36 md:scroll-mt-20 bg-fixed-ink py-14 text-white sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-fixed-lime">Untuk coach</p>
          <h2 className="mx-auto mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Kamu fokus mengajar. Sisanya diurus sistem.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/75">
            Kami tidak menjanjikan peserta instan. Member memilih coach dari profilnya, jadi makin lengkap keahlian,
            sertifikat, dan jadwalmu, makin besar peluang kamu dipilih.
          </p>
        </div>
        <PointGrid points={COACH_POINTS} dark />
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-white/70">
          Satu kewajiban yang perlu kamu tahu: mulai 1 Oktober 2026, catatan perkembangan peserta diisi setiap 2 sesi
          Hadir.
        </p>
        <div className="mt-8 text-center">
          <Link href="/daftar-coach" className="inline-block rounded-full bg-fixed-lime-500 px-6 py-3 text-base font-semibold text-fixed-ink hover:bg-fixed-lime-100">
            Daftar jadi coach
          </Link>
        </div>
      </div>
    </section>
  );
}

const POOL_POINTS: Point[] = [
  {
    title: "Gabung gratis",
    body: "Tanpa biaya pendaftaran maupun biaya bulanan. Platform hanya mengambil komisi dari sesi yang terlaksana.",
  },
  {
    title: "Bagi hasil setiap sesi Hadir",
    body: "Bagian kolam masuk ke saldo otomatis setiap sesi ditandai Hadir, dan semua pihak melihat angka yang sama.",
  },
  {
    title: "Kamu yang menentukan paket dan harga",
    body: "Usulkan paket dan harga untuk kolammu. Berlaku setelah diperiksa admin, paling lambat 1×24 jam.",
  },
  {
    title: "Tiket peserta sudah tercakup",
    body: "Tiket masuk peserta tercakup di bagian kolam dari harga paket, jadi tidak ada penagihan terpisah di loket.",
  },
  {
    title: "Ajak member sendiri",
    body: "Kolam punya kode afiliasi. Member yang mendaftar memakai kode kolammu tercatat sebagai rujukan kolam, dan kolam mendapat komisi afiliasi dari bagian SPH.",
  },
  {
    title: "Pembagian tanggung jawab jelas",
    body: "Kolam menjaga keselamatan fasilitas, coach bertanggung jawab atas pengajaran, SPH mengurus pemesanan dan pembayaran.",
  },
];

export function PoolSection({ waLink }: { waLink: string }) {
  return (
    <section id="untuk-kolam" className="scroll-mt-36 md:scroll-mt-20 mx-auto w-full max-w-6xl px-4 py-14 sm:py-16">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-fixed-muted">Untuk pemilik kolam</p>
        <h2 className="mx-auto mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Jam sepi kolammu, jadi les privat yang terjadwal.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-fixed-muted">
          Kolam tetap kolam umum. Les privat mengisi jam kosong tanpa kamu mengurus coach atau pembayaran. SPH
          memperkenalkan kolammu kepada orang tua yang mencari les renang di aplikasi, tanpa menjanjikan jumlah member.
        </p>
      </div>
      <PointGrid points={POOL_POINTS} />
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/daftar-kolam" className="inline-block rounded-full bg-fixed-ink px-6 py-3 text-base font-semibold text-white hover:bg-fixed-ink-deep">
          Daftarkan kolam
        </Link>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full border border-fixed-ink/25 px-6 py-3 text-base font-semibold hover:bg-white">
          Tanya lewat WhatsApp
        </a>
      </div>
    </section>
  );
}
