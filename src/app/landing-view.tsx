import Image from "next/image";
import Link from "next/link";
import { Logotype } from "@/components/ui/logotype";
import { buildOwnerInquiryWaLink } from "@/lib/whatsapp";
import { BUSINESS_ADDRESS } from "@/lib/business";
import { formatRupiah } from "@/lib/format";
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, DROP_IN_MARKUP_PERCENT, MIN_WITHDRAWAL } from "@/lib/policy";
import { AudienceTabs, FaqTabs, type AudienceSteps, type FaqGroup } from "./landing-tabs";
import { Avatar } from "@/components/ui/avatar";
import { Reveal } from "@/components/ui/reveal";
import { PAYMENT_METHODS } from "./landing-payments";

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
  fromPerSession: number | null;
};
type LandingCoach = {
  id: string;
  name: string;
  bio: string | null;
  specialties: string[];
  photoUrl: string | null;
  certified: boolean;
  certificationNote: string | null;
  bioLine: string | null;
  pools: string[];
};

const INK = "#14140F";
const OWNER_WA_LINK = buildOwnerInquiryWaLink();

const AUDIENCES: AudienceSteps[] = [
  {
    key: "ortu",
    label: "Orang tua / peserta",
    steps: [
      { title: "Daftar & tambah peserta", body: "Satu akun untuk kamu sendiri dan/atau beberapa anak. Setiap peserta punya paket dan sisa sesi sendiri." },
      { title: "Beli paket di kolam pilihan", body: "Bayar online lewat Midtrans. Paket langsung aktif dan berlaku di kolam tempat paket dibeli." },
      { title: "Booking coach & jam", body: "Pilih coach dan jam yang masih kosong. Slot yang sudah diambil orang lain otomatis terkunci." },
      { title: "Datang & les", body: `Tidak bisa datang? Batalkan sendiri paling lambat ${CANCEL_WINDOW_HOURS} jam sebelumnya, sesi kembali ke paket.` },
    ],
  },
  {
    key: "coach",
    label: "Coach",
    steps: [
      { title: "Daftar sebagai coach", body: "Isi profil dan keahlian. Setelah akun disetujui admin, upload foto dan sertifikat untuk badge Bersertifikat." },
      { title: "Buka jadwal per kolam", body: "Tentukan tanggal, jam, dan kolam tempat kamu mengajar. Sistem mencegah jadwal bentrok antar kolam." },
      { title: "Tandai kehadiran", body: "Setelah sesi selesai, tandai peserta hadir atau tidak dari menu Riwayat Sesi." },
      { title: "Cairkan saldo", body: "Bagianmu masuk ke saldo setiap sesi Hadir, lalu bisa dicairkan ke rekening." },
    ],
  },
  {
    key: "kolam",
    label: "Pemilik kolam",
    steps: [
      { title: "Gabung jadi mitra", body: "Daftarkan kolam, lengkapi alamat, jam buka, dan fasilitas." },
      { title: "Usulkan paket & harga", body: "Setiap kolam punya katalog dan harga sendiri; perubahan berlaku setelah diperiksa admin." },
      { title: "Pantau jam ramai", body: "Lihat jam berapa kolam dipakai les privat, oleh coach siapa, setiap hari." },
      { title: "Terima bagi hasil", body: "Bagian kolam masuk ke saldo setiap sesi Hadir dan bisa dicairkan ke rekening." },
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
        q: "Paket bisa dipakai di kolam mana saja?",
        a: `Paket berlaku di kolam tempat paket dibeli. Kalau sesekali ingin les di kolam mitra lain, member yang masih punya paket aktif bisa beli 1 sesi di kolam tersebut (harga per sesi kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari).`,
      },
      {
        q: "Satu akun untuk berapa anak?",
        a: "Satu akun orang tua bisa punya banyak peserta: kamu sendiri dan/atau beberapa anak. Paket dan sisa sesi dihitung per peserta, jadi tidak tercampur.",
      },
      {
        q: "Bagaimana kalau batal mendadak?",
        a: `Setiap paket punya jatah pembatalan mandiri, paling lambat ${CANCEL_WINDOW_HOURS} jam sebelum jadwal. Di luar itu bisa menghubungi admin lewat tombol bantuan di aplikasi. Tidak hadir tanpa membatalkan berarti sesi tetap terpakai.`,
      },
      {
        q: "Kalau coach berhalangan, sesinya hangus?",
        a: "Tidak. Coach yang membatalkan sesi otomatis mengembalikan sisa sesi ke paket peserta, dan kamu dapat notifikasi pembatalannya.",
      },
      {
        q: "Pembayarannya lewat apa?",
        a: "Lewat Midtrans: virtual account bank, QRIS, e-wallet, atau kartu. Paket aktif otomatis setelah pembayaran masuk.",
      },
      {
        q: "Apakah coach-nya bersertifikat?",
        a: 'Coach bisa mengunggah sertifikat renang/lifeguard. Badge "Bersertifikat" hanya tampil setelah sertifikat diperiksa dan disetujui admin.',
      },
      {
        q: "Umur berapa yang bisa ikut?",
        a: "Tergantung coach dan kolamnya. Di profil setiap coach ada keahliannya, misalnya renang bayi & balita, anak usia dini, atau persiapan kompetisi.",
      },
    ],
  },
  {
    key: "coach",
    label: "Coach",
    items: [
      {
        q: "Bagaimana cara gabung jadi coach?",
        a: "Daftar lewat halaman Daftar Coach, isi profil dan keahlian. Akun aktif setelah disetujui admin, lalu kolam mitra bisa menambahkanmu sebagai coach di kolam mereka.",
      },
      {
        q: "Bisa mengajar di lebih dari satu kolam?",
        a: "Bisa. Jadwal dibuka per kolam, dan sistem mencegah kamu membuka jam yang bentrok antar kolam.",
      },
      {
        q: "Kapan bagian saya masuk?",
        a: "Setiap sesi yang kamu tandai Hadir langsung menambah saldo kamu, sesuai persentase bagian coach yang berlaku di kolam tersebut.",
      },
      {
        q: "Cara mencairkan saldo?",
        a: `Isi rekening sekali di menu Saldo, lalu ajukan pencairan minimal ${formatRupiah(MIN_WITHDRAWAL)}. Admin memproses transfer dan statusnya terlihat di riwayat pencairan.`,
      },
      {
        q: "Kalau saya tidak bisa mengajar?",
        a: "Batalkan sesinya dari menu Jadwal. Sisa sesi member otomatis kembali dan member mendapat notifikasi, jadi tidak ada yang dirugikan diam-diam.",
      },
      {
        q: "Apa untungnya dibanding cari murid sendiri?",
        a: "Jadwal, absensi, dan pembayaran diurus sistem. Kamu tinggal membuka jam kosong, mengajar, dan menandai kehadiran.",
      },
    ],
  },
  {
    key: "kolam",
    label: "Pemilik kolam",
    items: [
      {
        q: "Apa untungnya buat kolam saya?",
        a: "Jam sepi bisa terisi les privat, dan setiap sesi yang terlaksana memberi bagian ke kolam secara otomatis. Kamu juga bisa melihat jam ramai kolam setiap hari.",
      },
      {
        q: "Siapa yang menentukan harga paket?",
        a: "Kamu yang mengusulkan paket dan harga untuk kolam kamu. Usulan berlaku setelah diperiksa admin, dan paket yang sudah dibeli member tidak ikut berubah.",
      },
      {
        q: "Bagaimana pembagian hasilnya?",
        a: "Setiap sesi yang ditandai Hadir dibagi ke platform, coach, dan kolam sesuai persentase yang disepakati per kolam. Semua pihak melihat angka yang sama.",
      },
      {
        q: "Saya juga harus menyediakan coach?",
        a: "Tidak harus. Coach yang sudah terdaftar di platform bisa diafiliasikan ke kolam kamu; kamu tetap bisa memakai coach sendiri kalau punya.",
      },
      {
        q: "Cara gabung jadi mitra?",
        a: "Daftar lewat halaman Daftarkan Kolam atau hubungi kami lewat WhatsApp. Setelah kolam disetujui admin, kolam kamu langsung tampil di halaman ini.",
      },
    ],
  },
];

export default function LandingView({ stats, pools, coaches }: { stats: LandingStats; pools: LandingPool[]; coaches: LandingCoach[] }) {
  const STATS = [
    { value: stats.poolCount, label: "Kolam mitra" },
    { value: stats.coachCount, label: "Coach aktif" },
    { value: stats.memberCount, label: "Member terdaftar" },
    { value: stats.attendedCount, label: "Sesi terlaksana" },
  ];

  return (
    // Landing selalu tampilan terang (warna dipaku), tidak ikut dark mode.
    <main className="flex min-h-screen flex-col bg-[#F3F2EC] text-[#14140F]" style={{ colorScheme: "light" }}>
      {/* Hero foto penuh: gambar perenang sengaja ditaruh agak ke atas, dan
          headline turun ke bawah, supaya yang pertama dilihat foto dulu baru
          judulnya (Hadi 18 Sep). */}
      <section className="relative isolate flex min-h-[760px] flex-col overflow-hidden text-white sm:min-h-[860px]">
        <Image
          src="/images/landing/hero-swim.jpg"
          alt=""
          fill
          priority
          className="-z-20 object-cover object-[50%_18%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/10 to-black/85" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-5 sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-white">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
            <Logotype className="text-base sm:text-xl" />
          </Link>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#kolam" className="hover:underline">Kolam</a>
            <a href="#coach" className="hover:underline">Coach</a>
            <a href="#cara-kerja" className="hover:underline">Cara Kerja</a>
            <a href="#faq" className="hover:underline">FAQ</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/10 sm:px-4">Masuk</Link>
            <Link href="/register" className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#14140F] hover:bg-[#E3F5B0] sm:px-4">Daftar</Link>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-end px-4 pb-8 text-center">
          <p className="rounded-full border border-white/30 px-4 py-1.5 text-sm">
            Les renang privat · {stats.poolCount} kolam mitra · {stats.coachCount} coach
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-balance drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)] sm:text-6xl">
            Satu aplikasi untuk orang tua, coach, dan kolam renang.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            Orang tua booking jam yang masih kosong, coach mengatur jadwalnya sendiri, dan kolam melihat pemakaian
            hariannya. Setiap sesi yang benar-benar terlaksana langsung dibagi ke kolam dan coach.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-full bg-[#9FCC1F] px-6 py-3 text-base font-semibold text-[#14140F] hover:bg-[#E3F5B0]">
              Daftar sebagai member
            </Link>
            <a href="#kolam" className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold hover:bg-white/10">
              Lihat kolam
            </a>
          </div>
          <p className="mt-4 text-sm text-white/75">
            Coach?{" "}
            <Link href="/daftar-coach" className="font-semibold text-white underline">Daftar jadi coach</Link>
            {" · "}Punya kolam?{" "}
            <Link href="/daftar-kolam" className="font-semibold text-white underline">Daftarkan kolam</Link>
          </p>
        </div>

        <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 border-t border-white/20 px-4 py-6 text-center sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <dd className="text-3xl font-semibold tabular-nums sm:text-4xl">{s.value.toLocaleString("id-ID")}</dd>
              <dt className="text-sm text-white/75">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Sub-navigasi tab: lompat ke info kolam / coach */}
      <nav aria-label="Lompat ke bagian" className="sticky top-0 z-30 border-b border-[#14140F]/10 bg-[#F3F2EC]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {[
            ["#kolam", "Info Kolam"],
            ["#coach", "Info Coach"],
            ["#cara-kerja", "Cara Kerja"],
            ["#faq", "Pertanyaan Umum"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="shrink-0 rounded-full border border-[#14140F]/15 bg-white px-4 py-2 text-sm font-semibold hover:bg-[#ECE9DC]">
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* Kolam: maksimal 5 kolam paling laris, lengkap dengan foto, fasilitas,
          dan jumlah member yang les di situ. */}
      <section id="kolam" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Kolam mitra</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#5C5945]">
            Setiap kolam punya jadwal coach, harga paket, dan fasilitasnya sendiri. Info di bawah ini langsung diambil
            dari data kolam, bukan brosur lama.
          </p>
        </div>
        {pools.length === 0 ? (
          <p className="text-center text-[#5C5945]">Kolam mitra segera hadir.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {pools.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <article className="grid overflow-hidden rounded-3xl bg-white md:grid-cols-2">
                  <div className={`relative flex min-h-64 items-end bg-[#E3F5B0] p-8 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                    {p.photos[0] && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.photos[0]} alt={`Foto ${p.name}`} className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
                      </>
                    )}
                    <div className={`relative ${p.photos[0] ? "text-white" : ""}`}>
                      <p className={`text-sm font-medium ${p.photos[0] ? "text-white/80" : "text-[#14140F]/70"}`}>
                        Kolam mitra
                      </p>
                      <p className="text-3xl font-semibold leading-tight">{p.name}</p>
                      <p className={`mt-1 text-sm ${p.photos[0] ? "text-white/85" : "text-[#5C5945]"}`}>
                        {p.memberCount > 0 ? `${p.memberCount} member les di sini` : "Kolam baru bergabung"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 p-8">
                    {p.description ? (
                      <p className="text-base text-[#14140F]">{p.description}</p>
                    ) : (
                      <p className="text-base text-[#5C5945]">Les renang privat dengan coach pilihan di {p.name}.</p>
                    )}
                    <dl className="grid grid-cols-2 gap-4 border-t border-[#14140F]/10 pt-4 text-sm">
                      <div>
                        <dt className="text-[#5C5945]">Lokasi</dt>
                        <dd className="font-semibold">{p.address ?? "Segera diinformasikan"}</dd>
                      </div>
                      <div>
                        <dt className="text-[#5C5945]">Jam buka</dt>
                        <dd className="font-semibold">{p.hours ?? "Hubungi admin"}</dd>
                      </div>
                      <div>
                        <dt className="text-[#5C5945]">Harga mulai</dt>
                        <dd className="font-semibold">{p.fromPerSession ? `${formatRupiah(p.fromPerSession)}/sesi` : "Segera hadir"}</dd>
                      </div>
                      <div>
                        <dt className="text-[#5C5945]">Coach</dt>
                        <dd className="font-semibold">{p.coachCount} coach</dd>
                      </div>
                    </dl>
                    {p.facilities.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm text-[#5C5945]">Fasilitas</p>
                        <ul className="flex flex-wrap gap-1.5">
                          {p.facilities.map((f) => (
                            <li key={f} className="rounded-full bg-[#F3F2EC] px-3 py-1 text-sm">{f}</li>
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

      {/* Pernyataan */}
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-20 md:grid-cols-2">
        <div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Semua pihak melihat angka yang sama.
          </h2>
          <Link href="/register" className="mt-6 inline-block rounded-full bg-[#14140F] px-6 py-3 text-base font-semibold text-white hover:bg-black">
            Mulai sekarang
          </Link>
        </div>
        <div className="flex flex-col gap-4 text-base text-[#3D3B2E]">
          <p>
            Dulu jadwal les diatur lewat chat, sisa sesi dicatat manual, dan pembayaran dicek satu per satu. Di Swim Private
            Hub, orang tua booking sendiri jam yang masih kosong, coach melihat jadwalnya per kolam, dan kolam memantau jam
            ramai setiap hari.
          </p>
          <p>
            Pembayaran lewat Midtrans, lalu dibagi otomatis ke kolam dan coach setiap sesi ditandai Hadir. Semua pihak melihat
            angka yang sama.
          </p>
        </div>
      </section>

      {/* Coach: maksimal 5 coach, muncul satu per satu saat di-scroll
          (gaya referensi Stride), kartunya lebih besar & lebih lengkap. */}
      <section id="coach" className="scroll-mt-20 bg-[#ECE9DC] py-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Kenalan dengan coach</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-[#5C5945]">
              Umur, jenis kelamin, keahlian, dan kolam tempat mengajar. Jadwal dan sertifikat lengkapnya bisa dilihat
              setelah kamu mendaftar.
            </p>
          </div>
          {coaches.length === 0 ? (
            <p className="text-center text-[#5C5945]">Coach segera hadir.</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {coaches.map((c, i) => (
                <li key={c.id}>
                  <Reveal delay={i * 90}>
                    <article className="flex flex-col gap-6 rounded-3xl bg-white p-6 sm:flex-row sm:items-start sm:p-8">
                      <div className="h-44 w-full shrink-0 overflow-hidden rounded-2xl bg-[#F3F2EC] sm:h-40 sm:w-40">
                        {c.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.photoUrl} alt={`Foto ${c.name}`} className="h-full w-full object-cover" />
                        ) : (
                          <Avatar className="h-full w-full rounded-2xl" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-3xl font-semibold leading-tight">{c.name}</h3>
                          {c.certified && (
                            <span className="rounded-full bg-[#E3F5B0] px-3 py-1 text-xs font-semibold">
                              Bersertifikat{c.certificationNote ? ` · ${c.certificationNote}` : ""}
                            </span>
                          )}
                        </div>
                        {c.bioLine && <p className="mt-1 text-sm text-[#5C5945]">{c.bioLine}</p>}
                        {c.bio && <p className="mt-3 text-base text-[#3D3B2E]">{c.bio}</p>}
                        {c.specialties.length > 0 && (
                          <ul className="mt-4 flex flex-wrap gap-1.5">
                            {c.specialties.map((s) => (
                              <li key={s} className="rounded-full bg-[#F3F2EC] px-3 py-1 text-sm">{s}</li>
                            ))}
                          </ul>
                        )}
                        <p className="mt-4 text-sm text-[#5C5945]">
                          Mengajar di: <span className="font-semibold text-[#14140F]">{c.pools.join(", ") || "-"}</span>
                        </p>
                        <Link href={`/pelatih/${c.id}`} className="mt-3 inline-block text-sm font-semibold underline">
                          Lihat profil lengkap
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Cara kerjanya</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#5C5945]">Pilih peranmu untuk melihat langkahnya.</p>
        </div>
        <AudienceTabs audiences={AUDIENCES} />
        <p className="mt-8 text-center text-sm text-[#5C5945]">
          Punya kolam renang?{" "}
          <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#14140F] underline">
            Tanya soal kemitraan
          </a>{" "}
          atau{" "}
          <Link href="/daftar-kolam" className="font-semibold text-[#14140F] underline">daftarkan kolam</Link>. Coach bisa{" "}
          <Link href="/daftar-coach" className="font-semibold text-[#14140F] underline">daftar di sini</Link>.
        </p>
      </section>

      {/* FAQ per peran */}
      <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 pb-20">
        <h2 className="mb-3 text-center text-4xl font-semibold tracking-tight">Pertanyaan umum</h2>
        <p className="mb-8 text-center text-base text-[#5C5945]">Pilih peranmu, pertanyaannya beda-beda.</p>
        <FaqTabs groups={FAQ_GROUPS} />
      </section>

      {/* CTA + footer gelap */}
      <footer style={{ backgroundColor: INK }} className="mt-auto text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Mulai les renang minggu ini</h2>
          <Link href="/register" className="mt-8 rounded-full bg-[#9FCC1F] px-7 py-3.5 text-base font-semibold text-[#14140F] hover:bg-[#E3F5B0]">
            Daftar gratis
          </Link>
        </div>

        {/* Metode pembayaran: semua logo dirender satu warna lime lewat CSS
            mask, jadi rapi walau warna asli tiap logo beda-beda. */}
        <div className="mx-auto max-w-6xl border-t border-white/15 px-4 py-8">
          <p className="mb-4 text-center text-sm text-white/70">Pembayaran aman lewat Midtrans</p>
          <ul className="mx-auto grid max-w-3xl grid-cols-3 items-center justify-items-center gap-x-4 gap-y-5 sm:grid-cols-5 lg:grid-cols-7">
            {PAYMENT_METHODS.map((m) =>
              m.logo ? (
                <li key={m.label}>
                  <span
                    role="img"
                    aria-label={m.label}
                    className="block h-5 w-16 bg-[#C6FF3D]"
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
                <li key={m.label} className="flex h-5 w-16 items-center justify-center text-sm font-semibold tracking-wide text-[#C6FF3D]">
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
            <p>Les renang privat: booking jadwal, kelola paket, dan bagi hasil dalam satu aplikasi.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-white">Hubungi kami</p>
            <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
              WhatsApp +62 821-1717-3124
            </a>
            <a href="mailto:swimprivatehub@gmail.com" className="hover:text-white hover:underline">
              swimprivatehub@gmail.com
            </a>
            <p>{BUSINESS_ADDRESS}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-white">Gabung</p>
            <Link href="/register" className="hover:text-white hover:underline">Daftar sebagai member</Link>
            <Link href="/daftar-coach" className="hover:text-white hover:underline">Daftar jadi coach</Link>
            <Link href="/daftar-kolam" className="hover:text-white hover:underline">Daftarkan kolam</Link>
            <Link href="/panduan" className="hover:text-white hover:underline">Panduan pemakaian</Link>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-white">Ketentuan</p>
            <Link href="/syarat-ketentuan" className="hover:text-white hover:underline">Syarat &amp; Ketentuan</Link>
            <Link href="/kebijakan-privasi" className="hover:text-white hover:underline">Kebijakan Privasi</Link>
            <Link href="/kebijakan-pengembalian" className="hover:text-white hover:underline">Kebijakan Pengembalian</Link>
            <Link href="/kebijakan-cookie" className="hover:text-white hover:underline">Kebijakan Cookie</Link>
          </div>
        </div>

        <p className="pb-8 text-center text-xs text-white/50">© 2026 Swim Private Hub</p>
      </footer>
    </main>
  );
}
