"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logotype } from "@/components/ui/logotype";
import { buildOwnerInquiryWaLink } from "@/lib/whatsapp";
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, DROP_IN_MARKUP_PERCENT, MIN_WITHDRAWAL } from "@/lib/policy";
import { formatRupiah } from "@/lib/format";

// Panduan ditulis ulang 18 Sep 2026: dulu berupa blob HTML dengan font dan
// warna sendiri (Manrope/Inter), jadi terasa produk lain dibanding landing.
// Sekarang komponen React biasa, lebar dan warnanya sama dengan landing page.

const OWNER_WA_LINK = buildOwnerInquiryWaLink();

type Step = { title: string; body: string };
type Section = { heading: string; intro?: string; steps: Step[]; note?: string };
type Guide = { key: string; label: string; title: string; lead: string; sections: Section[] };

const DEMO_ACCOUNTS = [
  { name: "Dedi Kurniawan", role: "Member (orang tua)", login: "dedi.member@example.com" },
  { name: "Rina Marlina", role: "Member (orang tua)", login: "rina.member@example.com" },
  { name: "Ayu Lestari", role: "Coach", login: "ayu.coach@example.com" },
  { name: "Fajar Nugroho", role: "Coach", login: "fajar.coach@example.com" },
  { name: "Sari Wulandari", role: "Pemilik kolam (Melati)", login: "sari.melati@example.com" },
  { name: "Budi Santoso", role: "Pemilik kolam (Tirta Asri)", login: "budi.tirta@example.com" },
];

const HIGHLIGHTS = [
  {
    title: "Satu akun, banyak peserta",
    body: "Satu orang tua bisa mendaftarkan dirinya sendiri dan beberapa anak. Paket dan sisa sesi dihitung per peserta, jadi tidak pernah tertukar.",
  },
  {
    title: "Slot terkunci begitu diambil",
    body: "Begitu satu member mengambil jam tertentu dengan coach tertentu, slot itu langsung hilang dari daftar member lain. Coach juga tidak bisa membuka jam bentrok di dua kolam.",
  },
  {
    title: "Pembatalan yang adil",
    body: `Member bisa membatalkan sendiri paling lambat ${CANCEL_WINDOW_HOURS} jam sebelum jadwal, sesuai jatah tiap paket. Lewat dari itu tetap bisa minta bantuan admin.`,
  },
  {
    title: "Bagi hasil otomatis",
    body: "Setiap sesi yang ditandai Hadir langsung dibagi ke saldo kolam, coach, dan komisi platform (termasuk PPN 12%). Kolam dan coach mencairkan saldonya sendiri.",
  },
  {
    title: "Harga per kolam",
    body: "Tiap kolam punya katalog paket dan harganya sendiri. Perubahan harga diusulkan pemilik kolam dan berlaku setelah disetujui admin.",
  },
  {
    title: "Notifikasi dua arah",
    body: "Member booking, coach dapat notifikasi. Coach membuka slot baru, member aktif dapat notifikasi. Cukup diaktifkan sekali di browser.",
  },
];

const GUIDES: Guide[] = [
  {
    key: "member",
    label: "Member",
    title: "Panduan Member (orang tua)",
    lead: "Daftar, beli paket, booking jadwal, dan pantau sisa sesi tiap anak.",
    sections: [
      {
        heading: "1. Daftar & tambah peserta",
        steps: [
          { title: "Klik Daftar di halaman utama", body: "Isi nama kamu sendiri (yang punya akun), No HP, dan password. Email opsional." },
          { title: "Tentukan siapa yang les", body: "Bisa kamu sendiri, bisa anak, bisa keduanya. Peserta juga bisa ditambah kapan saja lewat menu Peserta." },
          { title: "Akun langsung aktif", body: "Kamu otomatis masuk dan diarahkan ke halaman Paket, karena akun baru belum punya paket." },
        ],
        note: "Kalau akunmu dibuatkan admin, kamu masuk pakai No HP + password sementara, lalu diminta membuat password baru.",
      },
      {
        heading: "2. Beli paket",
        steps: [
          { title: "Pilih kolam", body: "Setiap kolam menampilkan alamat, jam buka, fasilitas, dan foto. Paket hanya berlaku di kolam tempat paket dibeli." },
          { title: "Pilih paket dan pesertanya", body: "Tiap paket menampilkan harga, jumlah sesi, masa berlaku, dan jatah pembatalan. Pilih dulu paket ini untuk peserta yang mana." },
          { title: "Bayar lewat Midtrans", body: "Virtual account, QRIS, e-wallet, atau kartu. Paket aktif otomatis setelah pembayaran masuk, dan semua transaksi tercatat di menu Riwayat Bayar." },
        ],
      },
      {
        heading: "3. Booking sesi",
        steps: [
          { title: "Pilih peserta, kolam, dan tanggal", body: "Sisa sesi, sisa jatah batal, dan nama paket peserta tampil di bagian atas halaman." },
          { title: "Pilih coach & jam", body: "Slot kosong ada tombol Booking. Slot yang sudah diambil member lain otomatis terkunci." },
          { title: "Selesai", body: "Sisa sesi berkurang 1, dan coach mendapat notifikasi kalau notifikasinya sudah aktif." },
        ],
        note: `Belum punya paket di kolam itu tapi masih punya paket aktif di kolam lain? Ada tombol beli 1 sesi (harga per sesi kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari).`,
      },
      {
        heading: "4. Riwayat & pembatalan",
        steps: [
          { title: "Semua booking ada di menu Riwayat", body: "Dikelompokkan per tanggal dan per kolam, lengkap dengan statusnya." },
          { title: "Batalkan sendiri", body: `Tombol Batalkan muncul kalau masih ${CANCEL_WINDOW_HOURS} jam sebelum jadwal dan jatah batal paket itu masih ada. Sisa sesi otomatis kembali.` },
          { title: "Kalau tidak memenuhi syarat", body: "Muncul tombol WhatsApp ke admin dengan pesan yang sudah terisi otomatis." },
        ],
      },
      {
        heading: "5. Peserta, profil, dan bantuan",
        steps: [
          { title: "Menu Peserta", body: "Tambah peserta baru, lihat paket aktif tiap peserta, atau nonaktifkan peserta yang sudah tidak les." },
          { title: "Menu Profil Saya", body: "Ubah nama dan password. Klik Edit dulu, baru bisa mengubah isinya." },
          { title: "Tombol bantuan", body: "Ada di pojok kanan bawah setelah masuk. Pertanyaan umum dijawab asisten; yang perlu dicek admin diteruskan, balasannya muncul di jendela chat yang sama." },
        ],
      },
    ],
  },
  {
    key: "coach",
    label: "Coach",
    title: "Panduan Coach",
    lead: "Buka jadwal sendiri, tandai kehadiran, dan cairkan saldo.",
    sections: [
      {
        heading: "1. Buka jadwal",
        steps: [
          { title: "Pilih kolam dan tanggal", body: "Kolam yang muncul hanya kolam tempat kamu terdaftar." },
          { title: "Pilih jam mulai dan selesai", body: "Rentang jam otomatis dipecah jadi slot per jam. Misalnya 08.00–10.00 jadi dua slot: 08–09 dan 09–10." },
          { title: "Klik Tambah Slot", body: "Slot langsung bisa dibooking member. Member aktif yang sudah menyalakan notifikasi otomatis diberi tahu." },
        ],
        note: "Slot kosong yang jamnya sudah lewat otomatis disembunyikan karena sudah tidak bisa dibooking.",
      },
      {
        heading: "2. Kelola slot",
        steps: [
          { title: "Slot belum dibooking", body: "Bisa dihapus kalau salah jam. Ada konfirmasi sebelum slot benar-benar hilang." },
          { title: "Slot sudah dibooking", body: "Menampilkan nama peserta. Kalau kamu benar-benar berhalangan, batalkan dari sini: sisa sesi member otomatis kembali dan member dapat notifikasi." },
          { title: "Jadwal coach lain", body: "Di bagian bawah halaman, supaya kamu tahu siapa saja yang bertugas di hari yang sama." },
        ],
      },
      {
        heading: "3. Tandai kehadiran",
        steps: [
          { title: "Buka menu Riwayat Sesi", body: "Semua sesi yang sudah lewat waktunya menunggu ditandai." },
          { title: "Pilih Hadir atau Tidak Hadir", body: "Langsung tersimpan begitu dipilih, tidak perlu tombol Simpan." },
          { title: "Saldo masuk", body: "Komisimu masuk ke saldo hanya untuk sesi yang ditandai Hadir." },
        ],
        note: "Status yang sudah dipilih tidak bisa dikembalikan ke Belum ditandai — pastikan pilihannya benar.",
      },
      {
        heading: "4. Saldo & profil",
        steps: [
          { title: "Isi rekening sekali", body: "Setelah tersimpan, rekening terkunci. Klik Edit kalau mau mengubah." },
          { title: "Ajukan pencairan", body: `Minimal ${formatRupiah(MIN_WITHDRAWAL)}. Riwayat pencairan menampilkan status, tanggal, dan rekening tujuan.` },
          { title: "Lengkapi profil", body: "Tanggal lahir, jenis kelamin, bio, keahlian, foto, dan sertifikat. Orang tua sering memilih coach dari informasi ini." },
        ],
        note: 'Badge "Bersertifikat" baru tampil setelah sertifikat kamu diperiksa dan disetujui admin.',
      },
    ],
  },
  {
    key: "kolam",
    label: "Pemilik Kolam",
    title: "Panduan Pemilik Kolam",
    lead: "Pantau pemakaian kolam, atur paket & info kolam, dan cairkan komisi kolam.",
    sections: [
      {
        heading: "1. Dashboard & jadwal",
        steps: [
          { title: "Ringkasan bulan ini", body: "Sesi yang dihadiri, pendapatan kolam, paket terjual, jumlah coach, dan saldo yang bisa dicairkan." },
          { title: "Jam ramai hari ini", body: "Grafik per jam: berapa sesi les privat di tiap jam, dan jam mana yang masih kosong." },
          { title: "Menu Jadwal Kolam", body: "Per tanggal, lengkap dengan coach yang mengajar dan peserta yang les di jam itu." },
        ],
      },
      {
        heading: "2. Paket & info kolam",
        steps: [
          { title: "Usulkan paket atau harga", body: "Isi nama, harga, jumlah sesi, masa berlaku, dan jatah batal, lalu Kirim Usulan. Usulan berlaku setelah disetujui admin; paket yang sudah dibeli member tidak ikut berubah." },
          { title: "Lengkapi info kolam", body: "Deskripsi, alamat, telepon, jam buka-tutup, dan fasilitas. Informasi ini langsung tampil di halaman booking member, profil coach, dan landing page." },
          { title: "Unggah foto kolam", body: "Maksimal 6 foto. Foto pertama dipakai sebagai sampul di landing page dan halaman booking." },
        ],
      },
      {
        heading: "3. Saldo & laporan",
        steps: [
          { title: "Saldo kolam", body: "Bertambah setiap sesi yang ditandai Hadir oleh coach." },
          { title: "Ajukan pencairan", body: `Isi rekening (terkunci setelah disimpan, ubah lewat Edit), lalu ajukan minimal ${formatRupiah(MIN_WITHDRAWAL)}. Admin memproses transfernya.` },
          { title: "Laporan", body: "Rincian komisi kolam per sesi yang benar-benar Hadir, bisa disaring per rentang tanggal." },
        ],
      },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    title: "Panduan Admin",
    lead: "Kendali penuh atas user, kolam, paket, booking, pembayaran, dan pencairan.",
    sections: [
      {
        heading: "1. Dashboard & pesan",
        steps: [
          { title: "Kondisi hari ini", body: "Sesi hari ini & besok, uang masuk, pendapatan platform & PPN, saldo mengendap, dan ringkasan tiap kolam." },
          { title: "Perlu tindakan", body: "Pesan yang perlu dibalas, pencairan menunggu, sertifikat coach, usulan paket kolam, kolam belum disetujui, dan sesi lewat yang belum ditandai." },
          { title: "Menu Pesan", body: "Chat bantuan dari member, coach, dan pemilik kolam. Yang ditandai Perlu dibalas berarti asisten tidak bisa menjawabnya." },
        ],
      },
      {
        heading: "2. User",
        steps: [
          { title: "Tambah user baru", body: "Isi data, pilih peran. Untuk pemilik kolam bisa sekalian membuat kolam baru; untuk member bisa sekalian menentukan pesertanya." },
          { title: "Info detail user", body: "Klik nama siapa pun untuk melihat halaman detail: data akun, paket & peserta, booking terakhir, profil coach, kolam yang dikelola, dan pencairan." },
          { title: "Aksi cepat", body: "Hubungi lewat WhatsApp, reset password (menghasilkan password sementara), atau nonaktifkan akun." },
          { title: "Import massal", body: "Dipakai saat kolam baru bergabung membawa data member lama. Ada template dan petunjuknya di halaman Users." },
        ],
      },
      {
        heading: "3. Kolam, paket, dan booking",
        steps: [
          { title: "Tab Kolam", body: "Harga paket, saldo kolam, pembagian komisi (platform, coach, kolam), info & foto kolam, dan coach terafiliasi." },
          { title: "Tab Paket", body: "Katalog paket per kolam, persetujuan usulan harga dari pemilik kolam, dan paket per member untuk koreksi manual." },
          { title: "Tab Jadwal Booking", body: "Semua slot dikelompokkan per coach, tanggal, dan kolam. Admin bisa menandai kehadiran atau membatalkan booking siapa pun." },
        ],
      },
      {
        heading: "4. Keuangan",
        steps: [
          { title: "Uang Masuk", body: "Semua pembayaran paket dari member lewat Midtrans beserta statusnya." },
          { title: "Bagi Hasil", body: "Rincian per kolam: komisi platform (termasuk PPN 12%), komisi kolam, dan komisi coach untuk tiap sesi Hadir." },
          { title: "Pencairan Saldo", body: "Proses pengajuan dari kolam & coach (Tandai Dibayar / Tolak), dan catat penarikan pendapatan platform." },
        ],
      },
    ],
  },
];

const INSTALL_STEPS: { platform: string; steps: string[] }[] = [
  {
    platform: "Android — Chrome",
    steps: [
      "Buka link Swim Private Hub di Chrome.",
      'Kalau muncul tawaran "Tambahkan ke layar utama", langsung pilih itu.',
      "Kalau tidak muncul, tap titik tiga di pojok kanan atas.",
      'Pilih "Instal aplikasi" atau "Tambahkan ke Layar utama", lalu konfirmasi.',
      "Selesai. Ikonnya muncul di layar utama dan terbuka tanpa address bar.",
    ],
  },
  {
    platform: "iPhone — Safari",
    steps: [
      "Buka link Swim Private Hub di Safari.",
      "Tap ikon Share (kotak dengan panah ke atas) di bar bawah.",
      'Pilih "Tambah ke Layar Utama" / "Add to Home Screen".',
      'Tap "Tambah" untuk konfirmasi.',
      "Ikonnya muncul di layar utama seperti aplikasi biasa.",
    ],
  },
  {
    platform: "iPhone — Chrome",
    steps: [
      "Buka link Swim Private Hub di Chrome.",
      "Tap ikon Share di bar bawah layar.",
      'Kalau pilihannya belum kelihatan, pilih "View More".',
      'Pilih "Tambah ke Layar Utama", lalu tap "Tambah".',
    ],
  },
];

const TABS = [
  { key: "presentasi", label: "Presentasi" },
  ...GUIDES.map((g) => ({ key: g.key, label: g.label })),
  { key: "install", label: "Install ke HP" },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3 rounded-2xl bg-white p-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#9FCC1F] text-sm font-bold text-[#14140F]">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[#14140F]">{s.title}</p>
            <p className="mt-0.5 text-sm text-[#3D3B2E]">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function PanduanView() {
  const [tab, setTab] = useState("presentasi");
  const guide = GUIDES.find((g) => g.key === tab);

  return (
    // Panduan mengikuti landing: selalu tampilan terang, lebar maksimal sama.
    <main className="flex min-h-screen flex-col bg-[#F3F2EC] text-[#14140F]" style={{ colorScheme: "light" }}>
      <header className="border-b border-[#14140F]/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
            <Logotype className="text-sm sm:text-xl" />
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link href="/login" className="rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-[#ECE9DC] sm:px-4">
              Masuk
            </Link>
            <Link href="/register" className="rounded-full bg-[#14140F] px-2.5 py-2 text-sm font-semibold text-white hover:bg-black sm:px-4">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <nav aria-label="Bagian panduan" className="sticky top-0 z-30 border-b border-[#14140F]/10 bg-[#F3F2EC]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                window.scrollTo({ top: 0 });
              }}
              aria-current={t.key === tab}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                t.key === tab ? "bg-[#14140F] text-white" : "border border-[#14140F]/15 bg-white hover:bg-[#ECE9DC]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {tab === "presentasi" && (
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <section>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Satu aplikasi untuk orang tua, coach, dan kolam renang.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[#3D3B2E]">
              Tidak ada lagi jadwal yang diatur lewat chat, sisa sesi yang dihitung manual, atau bagi hasil yang direkap
              di akhir bulan. Member booking sendiri, coach mengatur jadwalnya per kolam, pemilik kolam memantau
              pemakaian kolamnya, dan admin melihat semuanya dari satu dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-full bg-[#9FCC1F] px-6 py-3 text-base font-semibold hover:bg-[#E3F5B0]">
                Coba jadi member
              </Link>
              <a
                href={OWNER_WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#14140F]/20 px-6 py-3 text-base font-semibold hover:bg-[#ECE9DC]"
              >
                Punya kolam renang? Hubungi kami
              </a>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-semibold tracking-tight">Kenapa ini beda</h2>
            <p className="mt-2 max-w-2xl text-base text-[#5C5945]">
              Bukan aplikasi booking umum: setiap bagian mengikuti cara kerja les renang privat.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {HIGHLIGHTS.map((h) => (
                <li key={h.title} className="rounded-2xl bg-white p-6">
                  <h3 className="text-lg font-semibold">{h.title}</h3>
                  <p className="mt-2 text-sm text-[#3D3B2E]">{h.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-semibold tracking-tight">Empat peran, empat tampilan</h2>
            <p className="mt-2 max-w-2xl text-base text-[#5C5945]">
              Setiap orang hanya melihat yang relevan untuknya. Klik salah satu untuk membuka panduan lengkapnya.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {GUIDES.map((g) => (
                <li key={g.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setTab(g.key);
                      window.scrollTo({ top: 0 });
                    }}
                    className="h-full w-full rounded-2xl bg-white p-6 text-left transition-colors hover:bg-[#ECE9DC]"
                  >
                    <h3 className="text-xl font-semibold">{g.title}</h3>
                    <p className="mt-2 text-sm text-[#3D3B2E]">{g.lead}</p>
                    <span className="mt-3 inline-block text-sm font-semibold underline">Lihat panduan →</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-semibold tracking-tight">Akun demo</h2>
            <p className="mt-2 max-w-2xl text-base text-[#5C5945]">
              Semua password sama: <b className="text-[#14140F]">qwertyuiop</b>. Masuk dengan email di bawah untuk
              mencoba tiap peran. Akun admin tidak dibagikan di sini; hubungi kami kalau perlu akses admin untuk
              evaluasi.
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-[#14140F]/10 text-left text-xs uppercase tracking-wide text-[#5C5945]">
                    <th className="px-5 py-3 font-medium">Nama</th>
                    <th className="px-5 py-3 font-medium">Peran</th>
                    <th className="px-5 py-3 font-medium">Masuk pakai email</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ACCOUNTS.map((a) => (
                    <tr key={a.login} className="border-b border-[#14140F]/10 last:border-0">
                      <td className="px-5 py-3 font-medium">{a.name}</td>
                      <td className="px-5 py-3 text-[#5C5945]">{a.role}</td>
                      <td className="px-5 py-3 font-mono text-[#14140F]">{a.login}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {guide && (
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <h1 className="text-4xl font-semibold tracking-tight">{guide.title}</h1>
          <p className="mt-2 max-w-2xl text-base text-[#5C5945]">{guide.lead}</p>

          <div className="mt-8 flex flex-col gap-10">
            {guide.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-2xl font-semibold tracking-tight">{s.heading}</h2>
                {s.intro && <p className="mt-2 max-w-2xl text-base text-[#5C5945]">{s.intro}</p>}
                <div className="mt-4">
                  <StepList steps={s.steps} />
                </div>
                {s.note && (
                  <p className="mt-3 rounded-2xl border border-[#9FCC1F] bg-[#F1FBDD] px-4 py-3 text-sm text-[#3D3B2E]">
                    {s.note}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      )}

      {tab === "install" && (
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <h1 className="text-4xl font-semibold tracking-tight">Install ke HP</h1>
          <p className="mt-2 max-w-2xl text-base text-[#5C5945]">
            Tidak perlu Play Store atau App Store. Swim Private Hub adalah website yang bisa &ldquo;dipasang&rdquo; ke
            layar utama HP, supaya terbuka seperti aplikasi biasa tanpa mengetik alamatnya lagi.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {INSTALL_STEPS.map((p) => (
              <li key={p.platform} className="rounded-2xl bg-white p-6">
                <h2 className="text-lg font-semibold">{p.platform}</h2>
                <ol className="mt-3 flex flex-col gap-2 text-sm text-[#3D3B2E]">
                  {p.steps.map((s, i) => (
                    <li key={s} className="flex gap-2">
                      <span className="font-semibold text-[#14140F]">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="mt-auto bg-[#14140F] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logotype className="text-lg text-white" />
            <p className="mt-1 text-sm text-white/70">Sistem booking & manajemen les renang privat.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <Link href="/" className="hover:text-white hover:underline">
              Beranda
            </Link>
            <Link href="/daftar-coach" className="hover:text-white hover:underline">
              Daftar jadi coach
            </Link>
            <Link href="/daftar-kolam" className="hover:text-white hover:underline">
              Daftarkan kolam
            </Link>
            <Link href="/syarat-ketentuan" className="hover:text-white hover:underline">
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
