import Image from "next/image";
import Link from "next/link";
import { Logotype } from "@/components/ui/logotype";
import { buildOwnerInquiryWaLink } from "@/lib/whatsapp";
import { BUSINESS_ADDRESS } from "@/lib/business";
import { formatRupiah } from "@/lib/format";
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, DROP_IN_MARKUP_PERCENT } from "@/lib/policy";
import { AudienceTabs, type AudienceSteps } from "./landing-tabs";
import { Avatar } from "@/components/ui/avatar";

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

const FAQ_ITEMS = [
  {
    q: "Perlu install aplikasi?",
    a: "Tidak perlu. Swim Private Hub berbasis web, cukup dibuka lewat browser HP atau komputer. Kamu juga bisa menambahkannya ke layar utama HP supaya terbuka seperti aplikasi.",
  },
  {
    q: "Paket bisa dipakai di kolam mana saja?",
    a: `Paket berlaku di kolam tempat paket dibeli. Kalau sesekali ingin les di kolam mitra lain, member yang masih punya paket aktif bisa beli 1 sesi di kolam tersebut (harga per sesi kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari).`,
  },
  {
    q: "Bagaimana kalau batal mendadak?",
    a: `Setiap paket punya jatah pembatalan mandiri, paling lambat ${CANCEL_WINDOW_HOURS} jam sebelum jadwal. Di luar itu, kamu bisa menghubungi admin lewat tombol bantuan di aplikasi. Tidak hadir tanpa membatalkan berarti sesi tetap terpakai.`,
  },
  {
    q: "Pembayarannya lewat apa?",
    a: "Lewat Midtrans: virtual account bank, QRIS, e-wallet, atau kartu. Bagian kolam dan coach dibagikan otomatis setiap sesi ditandai Hadir.",
  },
  {
    q: "Kalau butuh bantuan saat memakai aplikasi?",
    a: "Setelah masuk, ada tombol bantuan di pojok kanan bawah. Pertanyaan umum dijawab asisten, dan yang perlu dicek admin (misal pembayaran) diteruskan ke admin — balasannya muncul di jendela chat yang sama.",
  },
  {
    q: "Apakah coach-nya bersertifikat?",
    a: "Coach bisa mengunggah sertifikat renang/lifeguard. Badge \"Bersertifikat\" hanya tampil setelah sertifikat diperiksa dan disetujui admin.",
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
      {/* Hero foto penuh */}
      <section className="relative isolate flex min-h-[640px] flex-col overflow-hidden text-white sm:min-h-[720px]">
        <Image src="/images/landing/hero-swim.jpg" alt="" fill priority className="-z-20 object-cover" sizes="100vw" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <Link href="/" className="text-white">
            <Logotype className="text-xl" />
          </Link>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#kolam" className="hover:underline">Kolam</a>
            <a href="#coach" className="hover:underline">Coach</a>
            <a href="#cara-kerja" className="hover:underline">Cara Kerja</a>
            <a href="#faq" className="hover:underline">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/10">Masuk</Link>
            <Link href="/register" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#14140F] hover:bg-[#E3F5B0]">Daftar</Link>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="rounded-full border border-white/30 px-4 py-1.5 text-sm">Les renang privat · {stats.poolCount} kolam mitra</p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-7xl">
            Belajar renang, dengan jadwalmu sendiri.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Pilih kolam, pilih coach, lalu booking jam yang pas. Paket, jadwal, dan pembayaran dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-full bg-[#9FCC1F] px-6 py-3 text-base font-semibold text-[#14140F] hover:bg-[#E3F5B0]">
              Daftar sebagai member
            </Link>
            <a href="#kolam" className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold hover:bg-white/10">
              Lihat kolam
            </a>
          </div>
        </div>

        <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 border-t border-white/20 px-4 py-6 sm:grid-cols-4">
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

      {/* Kolam */}
      <section id="kolam" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Temukan kolammu</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#5C5945]">
            Setiap kolam mitra punya jadwal coach, harga paket, dan fasilitas sendiri.
          </p>
        </div>
        {pools.length === 0 ? (
          <p className="text-center text-[#5C5945]">Kolam mitra segera hadir.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {pools.map((p, i) => (
              <article key={p.id} className="grid overflow-hidden rounded-3xl bg-white md:grid-cols-2">
                <div className={`flex min-h-56 items-end bg-[#E3F5B0] p-8 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <div>
                    <p className="text-sm font-medium text-[#14140F]/70">Kolam mitra</p>
                    <p className="text-3xl font-semibold leading-tight">{p.name}</p>
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Pernyataan */}
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-20 md:grid-cols-2">
        <div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Satu tempat untuk orang tua, coach, dan kolam.
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

      {/* Coach */}
      <section id="coach" className="scroll-mt-20 bg-[#ECE9DC] py-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Kenalan dengan coach</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-[#5C5945]">
              Profil lengkap, jadwal, dan sertifikat bisa dilihat setelah kamu mendaftar.
            </p>
          </div>
          {coaches.length === 0 ? (
            <p className="text-center text-[#5C5945]">Coach segera hadir.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((c, i) => (
                <li key={c.id} className={`rounded-2xl bg-white p-4 shadow-sm transition-transform hover:rotate-0 ${["-rotate-2", "rotate-1", "rotate-2"][i % 3]}`}>
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F3F2EC]">
                    {c.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photoUrl} alt={`Foto ${c.name}`} className="h-full w-full object-cover" />
                    ) : (
                      <Avatar className="h-24 w-24" />
                    )}
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#5C5945]">{c.specialties.slice(0, 2).join(" · ") || "Renang privat"}</p>
                  <p className="text-2xl font-semibold">{c.name}</p>
                  {c.certified && (
                    <p className="mt-1 inline-block rounded-full bg-[#E3F5B0] px-3 py-1 text-xs font-semibold">
                      Bersertifikat{c.certificationNote ? ` · ${c.certificationNote}` : ""}
                    </p>
                  )}
                  {c.bio && <p className="mt-2 line-clamp-3 text-sm text-[#3D3B2E]">{c.bio}</p>}
                  <p className="mt-3 text-sm text-[#5C5945]">
                    Mengajar di: <span className="font-semibold text-[#14140F]">{c.pools.join(", ") || "-"}</span>
                  </p>
                  <Link href={`/pelatih/${c.id}`} className="mt-3 inline-block text-sm font-semibold underline">
                    Lihat profil
                  </Link>
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

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 pb-20">
        <h2 className="mb-8 text-center text-4xl font-semibold tracking-tight">Pertanyaan umum</h2>
        <div className="flex flex-col divide-y divide-[#14140F]/10 border-y border-[#14140F]/10">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold marker:content-none">
                {item.q}
                <span aria-hidden="true" className="text-2xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-base text-[#3D3B2E]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA + footer gelap */}
      <footer style={{ backgroundColor: INK }} className="mt-auto text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Mulai les renang minggu ini</h2>
          <Link href="/register" className="mt-8 rounded-full bg-[#9FCC1F] px-7 py-3.5 text-base font-semibold text-[#14140F] hover:bg-[#E3F5B0]">
            Daftar gratis
          </Link>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-white/15 px-4 py-8 text-sm text-white/70 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-1">
            <Logotype className="text-lg text-white" />
            <p>
              WhatsApp{" "}
              <a href={OWNER_WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">+62 821-1717-3124</a> · Email{" "}
              <a href="mailto:cianjurmarketers@gmail.com" className="hover:text-white hover:underline">cianjurmarketers@gmail.com</a>
            </p>
            <p>{BUSINESS_ADDRESS}</p>
          </div>
          <div className="flex flex-col gap-1.5 sm:items-end">
            <Link href="/panduan" className="hover:text-white hover:underline">Panduan</Link>
            <Link href="/kebijakan-privasi" className="hover:text-white hover:underline">Kebijakan Privasi</Link>
            <Link href="/syarat-ketentuan" className="hover:text-white hover:underline">Syarat &amp; Ketentuan</Link>
            <Link href="/kebijakan-pengembalian" className="hover:text-white hover:underline">Kebijakan Pengembalian</Link>
            <Link href="/kebijakan-cookie" className="hover:text-white hover:underline">Kebijakan Cookie</Link>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-white/50">© 2026 Swim Private Hub · Foto hero: stok (Pexels), bukan member atau kolam sungguhan.</p>
      </footer>
    </main>
  );
}
