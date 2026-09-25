import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logotype } from "@/components/ui/logotype";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Label, Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { ICONS } from "@/components/icons";
import { ThemeScope } from "./theme-scope";
import { ContrastTable } from "./contrast-table";
import { ConfirmDialogDemo } from "./confirm-dialog-demo";
import {
  LIGHT_CONTRAST_PAIRS,
  DARK_CONTRAST_PAIRS,
  OLD_KIT_CONTRAST_PAIRS,
  FIXED_TOKENS,
  ASSET_INVENTORY,
  CHANGELOG_ROWS,
} from "./data";

const TOC = [
  { href: "#esensi", label: "01 Esensi" },
  { href: "#logo", label: "02 Logo" },
  { href: "#warna", label: "03 Warna" },
  { href: "#huruf", label: "04 Tipografi" },
  { href: "#layout", label: "05 Bentuk & Layout" },
  { href: "#komponen", label: "06 Komponen" },
  { href: "#ikon", label: "07 Ikon & Sistem" },
  { href: "#sosial", label: "08 Aset Sosial" },
  { href: "#gelap", label: "09 Tema Gelap" },
  { href: "#gerak", label: "10 Gerak & A11y" },
  { href: "#bahasa", label: "11 Bahasa" },
  { href: "#dev", label: "12 Untuk Developer" },
  { href: "#aset", label: "13 Inventaris" },
  { href: "#checklist", label: "14 Checklist" },
  { href: "#temuan", label: "15 Riwayat & Temuan" },
];

function Section({ id, eyebrow, title, lede, children }: { id: string; eyebrow: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border py-10 first:border-t-0 first:pt-0">
      <span className="text-xs font-bold uppercase tracking-wide text-brand-700">{eyebrow}</span>
      <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-text text-wrap-balance sm:text-3xl">{title}</h2>
      {lede ? <p className="mt-2 max-w-2xl text-sm text-text-muted">{lede}</p> : null}
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-text">{children}</h3>;
}

function Note({ tone = "neutral", title, children }: { tone?: "neutral" | "warning"; title: string; children: ReactNode }) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-xl border border-warning-text/25 bg-warning-bg p-4 text-sm text-warning-text"
          : "rounded-xl border border-border bg-surface-muted p-4 text-sm text-text-muted"
      }
    >
      <b className="block text-text">{title}</b>
      {children}
    </div>
  );
}

function TokenSwatch({ name, hex, use }: { name: string; hex: string; use: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <span aria-hidden className="h-10 w-10 shrink-0 rounded-lg border border-border/60" style={{ background: hex }} />
      <div className="min-w-0">
        <div className="font-mono text-xs font-medium text-text">{name}</div>
        <div className="font-mono text-xs uppercase text-text-subtle">{hex}</div>
        <div className="mt-0.5 text-xs text-text-muted">{use}</div>
      </div>
    </div>
  );
}

function DevFileTable({ rows }: { rows: { untuk: string; berkas: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="text-left text-xs text-text-subtle">
            <th className="py-1.5 font-medium">Untuk</th>
            <th className="py-1.5 font-medium">Berkas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.untuk} className="border-t border-border">
              <td className="py-2 pr-3 text-text">{r.untuk}</td>
              <td className="py-2 font-mono text-xs text-text-muted">{r.berkas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BrandGuidelineView() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 max-sm:min-h-[44px]">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
            <Logotype className="text-sm" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-brand-700 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center"
          >
            ← Beranda
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Cover */}
        <span className="text-xs font-bold uppercase tracking-wide text-brand-700">Swim Private Hub · Brand Guideline</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text text-wrap-balance sm:text-4xl">
          Lime Pulse, versi sistem
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
          Satu acuan untuk semua yang terlihat dan terbaca oleh pengguna: logo, warna, huruf, bentuk, komponen, gerak,
          dan bahasa. Halaman ini dibangun dari komponen dan token yang sungguhan dipakai aplikasi — bukan replika
          HTML — jadi kalau kode berubah, tampilan di sini otomatis ikut berubah.
        </p>
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-subtle">
          <div><dt className="inline font-medium text-text">Versi: </dt><dd className="inline">2.0 (rute Next.js)</dd></div>
          <div><dt className="inline font-medium text-text">Palet: </dt><dd className="inline">Charcoal · Cream · Lime</dd></div>
          <div><dt className="inline font-medium text-text">Logotype: </dt><dd className="inline font-mono">swim.privatehub</dd></div>
        </dl>

        {/* Table of contents */}
        <nav aria-label="Daftar bagian" className="mt-6 flex flex-wrap gap-2">
          {TOC.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted hover:border-brand-500 hover:text-text max-sm:min-h-[36px] max-sm:inline-flex max-sm:items-center"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Note title="Kalau ada yang bentrok">
          Urutan yang menang: <b className="text-text">kode</b> (<code>src/app/globals.css</code>,{" "}
          <code>src/components/ui/</code>) lebih tinggi dari halaman ini, dan halaman ini lebih tinggi dari file lama
          di <code>brand-kit/</code>. Semua contoh di bawah dirender dari komponen aplikasi yang sebenarnya, jadi kalau
          ada yang beda dari aplikasi, itu bug di halaman ini, bukan di aplikasi.
        </Note>

        {/* 01 Esensi */}
        <Section
          id="esensi"
          eyebrow="01 · Esensi Brand"
          title="Platform renang privat yang tenang, modern, dan bisa dipercaya"
          lede="Aplikasi les renang privat: pilih coach, pilih kolam, dan pilih jamnya. Buat anak atau kamu sendiri yang baru mau belajar. Coach kelola jadwal sendiri, kolam lihat pemakaian harian, semua dalam satu aplikasi."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="text-left text-xs text-text-subtle">
                  <th className="py-1.5 font-medium">Unsur</th>
                  <th className="py-1.5 font-medium">Nilai</th>
                  <th className="py-1.5 font-medium">Aturan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Nama lengkap", "Swim Private Hub", "Kapital di awal tiap kata. Dipakai di teks biasa, judul halaman, dokumen hukum"],
                  ["Logotype", "swim.privatehub", "Selalu huruf kecil, satu kata, titik berwarna. Hanya bila nama tampil sebagai logo"],
                  ["Domain", "swimprivatehub.biz.id", "Alamat situs dan email"],
                  ["Nama PWA", "Swim Private Hub", 'Nama penuh. Nama pendek di layar utama HP: "SPH Booking" (lihat bagian 15)'],
                  ["Bahasa", "Indonesia (id-ID)", 'Semua teks pengguna berbahasa Indonesia; atribut lang="id" di semua halaman'],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-border align-top">
                    <td className="py-2 pr-3 font-medium text-text">{row[0]}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-text">{row[1]}</td>
                    <td className="py-2 text-text-muted">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 02 Logo */}
        <Section
          id="logo"
          eyebrow="02 · Logo"
          title="Tanda, lockup, dan cara pakainya"
          lede="Tanda (squircle + gelombang) dan logotype bisa dipakai bersama atau terpisah, tetapi warnanya tetap: tidak ikut terbalik mengikuti latar."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface-muted p-6 text-center">
              <Image src="/logo.png" alt="Tanda Swim Private Hub" width={96} height={96} className="mx-auto h-20 w-20 rounded-2xl object-contain" />
              <p className="mt-3 text-xs text-text-subtle">Tanda: file asli <code>public/logo.png</code>, dipakai di header aplikasi</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-border bg-surface p-4">
                <Image
                  src="/brand-kit/logo/png/lockup-on-light-1040x240.png"
                  alt="Lockup swim.privatehub di latar terang"
                  width={1040}
                  height={240}
                  className="h-auto w-full max-w-[280px]"
                />
                <p className="mt-2 text-xs text-text-subtle">lockup-on-light — latar terang/cream</p>
              </div>
              <div className="rounded-xl border border-border bg-fixed-ink p-4">
                <Image
                  src="/brand-kit/logo/png/lockup-on-dark-1040x240.png"
                  alt="Lockup swim.privatehub di latar gelap"
                  width={1040}
                  height={240}
                  className="h-auto w-full max-w-[280px]"
                />
                <p className="mt-2 text-xs text-white/60">lockup-on-dark — latar charcoal</p>
              </div>
            </div>
          </div>

          <div>
            <SubHeading>Varian tanda (mark)</SubHeading>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { src: "/brand-kit/logo/svg/mark-lime.svg", label: "mark-lime", bg: "bg-surface" },
                { src: "/brand-kit/logo/svg/mark-cream.svg", label: "mark-cream", bg: "bg-fixed-lime" },
                { src: "/brand-kit/logo/svg/mark-white-mono.svg", label: "mark-white-mono", bg: "bg-fixed-ink" },
                { src: "/brand-kit/logo/png/mark-lime-512.png", label: "mark-lime (PNG, latar krem bawaan file)", bg: "bg-fixed-cream" },
              ].map((m) => (
                <div key={m.label} className={`flex flex-col items-center gap-2 rounded-xl border border-border ${m.bg} p-3`}>
                  <Image src={m.src} alt="" width={40} height={40} className="h-10 w-10" />
                  <span className="text-center text-xs font-mono text-text-subtle">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Note title="Aturan pemakaian">
            <ul className="mt-1 list-disc pl-5 text-text-muted">
              <li>Tanda selalu: langit lime di atas, air charcoal di bawah — jangan dibalik atau diputar.</li>
              <li>Di dalam aplikasi: ikon + logotype berdampingan (navbar, halaman masuk/daftar, footer).</li>
              <li>Logotype saja hanya untuk ruang sangat sempit — jangan pernah ikon saja tanpa nama, kecuali favicon/ikon aplikasi.</li>
              <li>Jangan mengganti warna, rasio, atau jarak huruf; jangan menambah bayangan atau efek 3D.</li>
              <li>
                Ruang aman: <b className="text-text">½ lebar tanda</b> di materi luar (banner, dokumen cetak),{" "}
                <b className="text-text">¼ lebar tanda</b> di bilah UI (header aplikasi) — lihat keputusan di bagian 15.
              </li>
              <li>
                Di latar charcoal, &quot;air&quot; (bagian bawah tanda) berwarna sama dengan latar, jadi tanda tampil sebagai
                bentuk lime dengan tepi bergelombang. Itu perilaku semua file tanda dan lockup saat ini (termasuk
                <code>lockup-on-dark</code>), bukan galat render — lihat temuan terbuka di bagian 15.
              </li>
            </ul>
          </Note>
        </Section>

        {/* 03 Warna */}
        <Section
          id="warna"
          eyebrow="03 · Warna"
          title="Palet Lime Pulse dan token sistem"
          lede="Charcoal dominan, cream untuk konten, lime hanya untuk aksen. Setiap warna punya nama token yang sama di kode, tema terang, dan tema gelap."
        >
          <div>
            <SubHeading>Warna tetap (tidak ikut tema)</SubHeading>
            <p className="mt-1 text-sm text-text-muted">
              Landing, panduan, dan halaman hukum tampil sama di tema terang maupun gelap (tidak ikut toggle tema). Warnanya dikunci lewat token{" "}
              <code>fixed-*</code> di <code>src/app/globals.css</code>.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FIXED_TOKENS.map((t) => (
                <TokenSwatch key={t.name} name={t.name} hex={t.hex} use={t.use} />
              ))}
            </div>
          </div>

          <div>
            <SubHeading>Kontras terukur: tema terang</SubHeading>
            <p className="mt-1 text-sm text-text-muted">
              Dihitung langsung dari kode warna di atas lewat rumus WCAG (<code>src/lib/contrast.ts</code>), bukan
              diukur dari layar. Batas: teks ≥ 4,5:1 (AA), teks besar/komponen UI ≥ 3:1.
            </p>
            <div className="mt-3"><ContrastTable pairs={LIGHT_CONTRAST_PAIRS} /></div>
          </div>

          <div>
            <SubHeading>Kontras terukur: tema gelap</SubHeading>
            <div className="mt-3"><ContrastTable pairs={DARK_CONTRAST_PAIRS} /></div>
          </div>

          <div>
            <SubHeading>Kenapa warna status di aplikasi berbeda dari kit lama</SubHeading>
            <p className="mt-1 text-sm text-text-muted">
              Nilai status di <code>palette.json</code>/<code>palette.css</code> versi lama tampak baik di swatch,
              tapi sebagai <b className="text-text">teks</b> di latar putih kontrasnya di bawah batas terbaca.
              Kedua file itu sudah disinkronkan ke nilai aplikasi (25 September 2026) — tabel berikut nilai historisnya:
            </p>
            <div className="mt-3"><ContrastTable pairs={OLD_KIT_CONTRAST_PAIRS} /></div>
          </div>

          <Note title="Aturan pemakaian warna">
            <div className="mt-1 grid gap-3 sm:grid-cols-2">
              <ul className="list-disc pl-5">
                <li>Pakai token (<code>bg-surface</code>, <code>text-text-muted</code>), bukan hex</li>
                <li>Lime hanya sebagai aksen, cincin fokus, dan CTA marketing</li>
                <li>Untuk warna yang harus tetap di dua tema, pakai <code>fixed-*</code></li>
              </ul>
              <ul className="list-disc pl-5">
                <li>Hindari kelas warna mentah (<code>bg-blue-500</code>)</li>
                <li>Hindari hex baru di komponen — tambahkan token bila perlu</li>
                <li>Lime tidak pernah dipakai sebagai warna teks di latar terang</li>
              </ul>
            </div>
          </Note>
        </Section>

        {/* 04 Tipografi */}
        <Section
          id="huruf"
          eyebrow="04 · Tipografi"
          title="Tiga huruf, tiga peran"
          lede="Satu keluarga untuk judul, satu untuk isi, satu untuk kode. Ukuran dan pemenggalannya sudah diatur global di CSS."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardBody>
              <div className="text-xs font-medium uppercase tracking-wide text-text-subtle">Judul & logotype</div>
              <div className="mt-1 font-heading text-2xl font-bold text-text">Sora</div>
              <p className="mt-1 text-xs text-text-muted">Geometris, karakter kuat. Bobot 600–800.</p>
            </CardBody></Card>
            <Card><CardBody>
              <div className="text-xs font-medium uppercase tracking-wide text-text-subtle">Isi & antarmuka</div>
              <div className="mt-1 font-sans text-2xl font-bold text-text">Plus Jakarta Sans</div>
              <p className="mt-1 text-xs text-text-muted">Humanis, mudah dibaca. Bobot 400–700.</p>
            </CardBody></Card>
            <Card><CardBody>
              <div className="text-xs font-medium uppercase tracking-wide text-text-subtle">Angka & kode</div>
              <div className="mt-1 font-mono text-2xl font-bold text-text">JetBrains Mono</div>
              <p className="mt-1 text-xs text-text-muted">Kode, nomor referensi. Bobot 500–600.</p>
            </CardBody></Card>
          </div>

          <div>
            <SubHeading>Skala yang dipakai di aplikasi</SubHeading>
            <div className="mt-3 flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
              {[
                { cls: "text-4xl font-semibold", sample: "Aplikasi les renang privat", meta: "text-4xl · 36px di HP, sm:text-6xl · 60px di layar lebar · judul halaman depan" },
                { cls: "text-2xl font-semibold", sample: "Booking Coach", meta: "text-2xl · 24px · judul halaman (h1)" },
                { cls: "text-xl font-semibold", sample: "Daftar Member", meta: "text-xl · 20px · judul kartu auth" },
                { cls: "text-lg font-semibold", sample: "Riwayat pembayaran", meta: "text-lg · 18px · judul bagian (h2)" },
                { cls: "text-sm font-normal font-sans", sample: "Teks antarmuka standar: tombol, input, paragraf kartu", meta: "text-sm · 14px · ukuran dasar UI" },
                { cls: "text-xs font-medium font-sans", sample: "Label, badge, keterangan kecil", meta: "text-xs · 12px · MINIMUM" },
              ].map((row) => (
                <div key={row.meta} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className={`${row.cls} text-text`}>{row.sample}</span>
                  <span className="shrink-0 font-mono text-xs text-text-subtle">{row.meta}</span>
                </div>
              ))}
            </div>
          </div>

          <Note tone="warning" title="Untuk developer">
            Jangan memakai <code>text-wrap</code> (shorthand) di CSS global di luar <code>@layer</code>: ia menimpa{" "}
            <code>truncate</code> dan <code>whitespace-nowrap</code> Tailwind. Pakai <code>text-wrap-style</code>.
          </Note>
        </Section>

        {/* 05 Bentuk & Layout */}
        <Section
          id="layout"
          eyebrow="05 · Bentuk & Tata Letak"
          title="Sudut, jarak, dan kerangka halaman"
          lede="Bentuk dibuat ramah dan konsisten: sudut membulat, garis tipis, bayangan halus, ruang napas cukup."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs text-text-subtle">
                  <th className="py-1.5 font-medium">Unsur</th>
                  <th className="py-1.5 font-medium">Nilai</th>
                  <th className="py-1.5 font-medium">Dipakai di</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Sudut kecil", "8px (rounded-lg)", "Tombol kecil, chip"],
                  ["Sudut standar", "12px (rounded-xl)", "Tombol, input, dialog"],
                  ["Sudut kartu", "16px (rounded-2xl)", "Card, panel"],
                  ["Pil", "rounded-full", "Badge, CTA marketing"],
                  ["Padding kartu", "16px (HP) / 20px (≥640px)", "CardBody"],
                  ["Jarak halaman", "16px (HP), 32px (≥1024px)", "Sisi kiri-kanan konten"],
                  ["Bayangan kartu", "0 2px 10px -2px rgba(20,20,15,.08)", "Card"],
                  ["Garis tepi", "1px, warna border", "Kartu, input, header"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-border">
                    <td className="py-2 pr-3 font-medium text-text">{row[0]}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-text-muted">{row[1]}</td>
                    <td className="py-2 text-text-muted">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-subtle">
            Area sentuh minimum di HP (di bawah 640px): <b className="text-text">44 × 44px</b> untuk tombol, tautan
            mandiri, dan kolom isian (kelas <code>max-sm:min-h-[44px]</code>). Tautan di tengah kalimat dikecualikan.
          </p>
        </Section>

        {/* 06 Komponen */}
        <Section
          id="komponen"
          eyebrow="06 · Komponen UI"
          title="Tombol, form, kartu, dan status"
          lede="Setiap komponen punya satu bentuk baku, dipakai identik di semua peran dan kedua tema. Semua contoh di bawah adalah komponen aplikasi yang sungguhan."
        >
          <div>
            <SubHeading>Tombol — src/components/ui/button.tsx</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ThemeScope theme="light">
                <div className="flex flex-wrap gap-2">
                  <Button>Simpan</Button>
                  <Button disabled>Simpan</Button>
                  <Button loading>Menyimpan</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary">Batal</Button>
                  <Button variant="danger">Nonaktifkan</Button>
                  <Button variant="ghost">Lihat semua</Button>
                </div>
                <Button size="sm">Edit</Button>
              </ThemeScope>
              <ThemeScope theme="dark">
                <div className="flex flex-wrap gap-2">
                  <Button>Simpan</Button>
                  <Button disabled>Simpan</Button>
                  <Button loading>Menyimpan</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary">Batal</Button>
                  <Button variant="danger">Nonaktifkan</Button>
                  <Button variant="ghost">Lihat semua</Button>
                </div>
                <Button size="sm">Edit</Button>
              </ThemeScope>
            </div>
            <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm", className: "mt-2" })}>
              Contoh &lt;Link&gt; berpenampilan tombol (buttonClass, bukan &lt;Button&gt; dibungkus &lt;a&gt;)
            </Link>
          </div>

          <div>
            <SubHeading>Badge — src/components/ui/badge.tsx</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ThemeScope theme="light">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">Aktif</Badge>
                  <Badge tone="warning">Menunggu persetujuan</Badge>
                  <Badge tone="danger">Nonaktif</Badge>
                  <Badge tone="neutral">Dibatalkan</Badge>
                  <Badge tone="brand">Paket 4×</Badge>
                  <Badge tone="accent">Populer</Badge>
                </div>
              </ThemeScope>
              <ThemeScope theme="dark">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">Aktif</Badge>
                  <Badge tone="warning">Menunggu persetujuan</Badge>
                  <Badge tone="danger">Nonaktif</Badge>
                  <Badge tone="neutral">Dibatalkan</Badge>
                  <Badge tone="brand">Paket 4×</Badge>
                  <Badge tone="accent">Populer</Badge>
                </div>
              </ThemeScope>
            </div>
          </div>

          <div>
            <SubHeading>Form — src/components/ui/input.tsx</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ThemeScope theme="light">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bg-demo-name-light">Nama Lengkap</Label>
                  <Input id="bg-demo-name-light" placeholder="Nama kamu" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bg-demo-filled-light">Contoh isian terpilih</Label>
                  <Input id="bg-demo-filled-light" defaultValue="Dedi Kurniawan" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bg-demo-disabled-light">Terkunci</Label>
                  <Input id="bg-demo-disabled-light" defaultValue="Tidak bisa diedit" disabled />
                </div>
              </ThemeScope>
              <ThemeScope theme="dark">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bg-demo-name-dark">Nama Lengkap</Label>
                  <Input id="bg-demo-name-dark" placeholder="Nama kamu" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bg-demo-filled-dark">Contoh isian terpilih</Label>
                  <Input id="bg-demo-filled-dark" defaultValue="Dedi Kurniawan" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bg-demo-disabled-dark">Terkunci</Label>
                  <Input id="bg-demo-disabled-dark" defaultValue="Tidak bisa diedit" disabled />
                </div>
              </ThemeScope>
            </div>
          </div>

          <div>
            <SubHeading>Kartu — src/components/ui/card.tsx</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ThemeScope theme="light" bare className="rounded-2xl border border-border p-4">
                <span className="mb-3 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-text-subtle">Terang</span>
                <Card><CardBody>
                  <h4 className="font-semibold text-text">Kolam Renang Melati</h4>
                  <p className="mt-0.5 text-xs text-text-muted">Sisa sesi: 6 · Jatah batal: 0</p>
                </CardBody></Card>
              </ThemeScope>
              <ThemeScope theme="dark" bare className="rounded-2xl border border-border p-4">
                <span className="mb-3 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-text-subtle">Gelap</span>
                <Card><CardBody>
                  <h4 className="font-semibold text-text">Kolam Renang Melati</h4>
                  <p className="mt-0.5 text-xs text-text-muted">Sisa sesi: 6 · Jatah batal: 0</p>
                </CardBody></Card>
              </ThemeScope>
            </div>
          </div>

          <div>
            <SubHeading>Dialog konfirmasi — src/components/ui/confirm-dialog.tsx</SubHeading>
            <p className="mt-1 text-sm text-text-muted">
              Komponennya sendiri melayang penuh layar (<code>fixed inset-0</code>), jadi tidak bisa dibekukan
              berdampingan seperti contoh lain — coba tombol di bawah untuk membuka komponen aslinya (Esc menutup,
              fokus otomatis ke tombol Batal).
            </p>
            <div className="mt-3"><ConfirmDialogDemo /></div>
          </div>

          <div>
            <SubHeading>Loading & Avatar</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <Loader size={20} label="Memuat" />
                <span className="text-sm text-text-muted">src/components/ui/loader.tsx — satu-satunya indikator pemuatan di aplikasi</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <Avatar className="h-12 w-12" />
                <span className="text-sm text-text-muted">src/components/ui/avatar.tsx — siluet default sebelum foto diunggah</span>
              </div>
            </div>
          </div>
        </Section>

        {/* 07 Ikon */}
        <Section
          id="ikon"
          eyebrow="07 · Ikon & Aset Sistem"
          title="Guratan tipis, satu warna, mengikuti teks"
          lede="Ikon fungsional dibuat sendiri dalam satu gaya guratan (src/components/icons.tsx); ikon sistem (favicon, PWA) identik di kit dan kode."
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Object.entries(ICONS).map(([name, Icon]) => (
              <div key={name} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3">
                <Icon className="h-6 w-6 text-text" />
                <span className="text-center font-mono text-xs text-text-subtle">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-subtle">
            Guratan (bukan isi), <code>strokeWidth 1.8</code>, warna ikut <code>currentColor</code>, viewBox 24×24.
          </p>

          <div>
            <SubHeading>Ikon sistem (identik dengan kode)</SubHeading>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- favicon.ico bukan format yang didukung next/image */}
                <img src="/favicon.ico" alt="" width={32} height={32} className="h-8 w-8" />
                <span className="text-xs text-text-subtle">favicon.ico</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Image src="/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
                <span className="text-xs text-text-subtle">icon-192.png</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Image src="/apple-icon.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
                <span className="text-xs text-text-subtle">apple-icon.png</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
                <span className="text-xs text-text-subtle">logo.png</span>
              </div>
            </div>
          </div>
        </Section>

        {/* 08 Aset Sosial */}
        <Section
          id="sosial"
          eyebrow="08 · Aset Sosial & Digital"
          title="Foto profil, banner, gambar bagikan"
          lede="Untuk profil media sosial resmi dan pratinjau tautan. File asli dari brand-kit/social/, bukan disalin ulang."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Image
                src="/brand-kit/social/profile-picture-500.png"
                alt="Foto profil sosial Swim Private Hub"
                width={500}
                height={500}
                className="h-auto w-full rounded-full border border-border"
              />
              <p className="mt-2 text-xs text-text-subtle">profile-picture-500.png</p>
            </div>
            <div className="sm:col-span-2">
              <Image
                src="/brand-kit/social/banner-linkedin-1584x396.png"
                alt="Banner LinkedIn Swim Private Hub"
                width={1584}
                height={396}
                className="h-auto w-full rounded-lg border border-border"
              />
              <p className="mt-2 text-xs text-text-subtle">banner-linkedin-1584x396.png</p>
            </div>
          </div>
          <p className="text-sm text-text-muted">
            Gambar bagikan (Open Graph) dibuat otomatis oleh kode lewat <code>src/app/opengraph-image.tsx</code> —
            bukan file statis — muncul saat tautan situs dibagikan di WhatsApp/media sosial.
          </p>
        </Section>

        {/* 09 Tema Gelap */}
        <Section
          id="gelap"
          eyebrow="09 · Tema Gelap"
          title="Bukan sekadar dibalik"
          lede="Aplikasi mendukung tema terang dan gelap penuh, dengan token warna terpisah yang sudah diukur kontrasnya (bagian 3)."
        >
          <p className="text-sm text-text-muted">
            Setiap contoh komponen di bagian 6 sudah ditampilkan berdampingan terang/gelap. Kotaknya memakai variabel
            CSS yang di-override lokal (lihat <code>theme-scope.tsx</code>) — bukan mengganti atribut{" "}
            <code>data-theme</code> di <code>&lt;html&gt;</code>, jadi tidak memengaruhi toggle tema situs.
          </p>
        </Section>

        {/* 10 Gerak & A11y */}
        <Section
          id="gerak"
          eyebrow="10 · Gerak & Aksesibilitas"
          title="Halus, dan bisa dimatikan"
          lede="Gerak menegaskan, tidak mengganggu — dan sepenuhnya berhenti kalau pengguna memintanya."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs text-text-subtle">
                  <th className="py-1.5 font-medium">Aturan</th>
                  <th className="py-1.5 font-medium">Penerapan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Kontras", "Teks minimal 4,5:1, teks besar/komponen minimal 3:1 (tabel di bagian 3)"],
                  ["Area sentuh", "44×44px minimum di HP (bagian 5), kecuali tautan dalam kalimat"],
                  ["Fokus keyboard", "Cincin fokus brand-500 di semua elemen interaktif"],
                  ["Dialog", 'Bisa ditutup dengan Esc, role="dialog", aria-modal'],
                  ["Status hidup", 'Pesan sukses/error pakai role="status" / role="alert"'],
                  ["Label", "Semua input berlabel; tombol ikon-saja punya aria-label"],
                  ["Elemen berlapis", "Tidak ada <a> membungkus <button> (memakai buttonClass())"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-border">
                    <td className="py-2 pr-3 font-medium text-text">{row[0]}</td>
                    <td className="py-2 text-text-muted">{row[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note title="Kurangi gerak">
            Seluruh transisi dan animasi (termasuk orb pemuatan dan scroll-reveal landing) mati otomatis kalau
            pengguna mengaktifkan &quot;Kurangi Gerak&quot; di sistem operasinya (<code>prefers-reduced-motion</code>).
            Konten tetap tampil penuh, hanya tanpa gerak.
          </Note>
        </Section>

        {/* 11 Bahasa */}
        <Section
          id="bahasa"
          eyebrow="11 · Bahasa & Nada"
          title="Ngobrol seperti coach yang bisa dipercaya, bukan sales"
          lede='Sapa dengan "kamu", tulis apa adanya, sebut akibatnya untuk pengguna — bukan istilah teknis.'
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="sm:col-span-2"><CardBody>
              <h4 className="font-medium text-text">Headline, subheadline &amp; tagline resmi</h4>
              <p className="mt-2 text-lg font-semibold text-text">Aplikasi les renang privat: pilih coach, pilih kolam, dan pilih jamnya.</p>
              <p className="mt-1 text-sm text-text-muted">Buat anak atau kamu sendiri yang baru mau belajar. Coach kelola jadwal sendiri, kolam lihat pemakaian harian, semua dalam satu aplikasi.</p>
              <p className="mt-2 text-xs text-text-subtle">
                Satu sumber, dipakai identik (tidak dipersingkat) di landing, panduan, footer, halaman masuk/daftar, gambar berbagi, dan banner. &quot;Pilih jam&quot; berarti dari jam
                kosong coach — jangan tulis &quot;bebas pilih jadwal&quot;, dan jangan pakai &quot;pertama/nomor 1&quot;.
              </p>
            </CardBody></Card>
            <Card><CardBody>
              <h4 className="font-medium text-text">Istilah baku</h4>
              <p className="mt-1 text-sm text-text-muted">
                Member (bukan customer), Coach (bukan pelatih), Sesi (bukan pertemuan), Saldo (bukan wallet), Cairkan
                saldo (bukan withdraw), Ditandai Hadir (bukan check-in).
              </p>
            </CardBody></Card>
            <Card><CardBody>
              <h4 className="font-medium text-text">Pengecualian</h4>
              <p className="mt-1 text-sm text-text-muted">
                Halaman hukum (Syarat & Ketentuan, Kebijakan Privasi) memakai &quot;Pengguna&quot; dan bahasa formal —
                satu-satunya pengecualian sapaan &quot;kamu&quot;.
              </p>
            </CardBody></Card>
          </div>
          <p className="text-xs text-text-subtle">
            Aturan lengkap dan daftar istilah: <code>brand-kit/MESSAGING.md</code>.
          </p>
        </Section>

        {/* 12 Developer */}
        <Section
          id="dev"
          eyebrow="12 · Panduan Developer"
          title="Token dan komponen yang wajib dipakai"
          lede="Ringkasan cepat: sebelum menulis style baru, cek apakah sudah ada di sini."
        >
          <DevFileTable
            rows={[
              { untuk: "Token warna & tema", berkas: "src/app/globals.css" },
              { untuk: "Komponen dasar", berkas: "src/components/ui/*.tsx" },
              { untuk: "Kerangka halaman & navigasi", berkas: "src/components/nav-bar.tsx, sidebar-nav.tsx, mobile-bottom-nav.tsx" },
              { untuk: "Ikon", berkas: "src/components/icons.tsx" },
              { untuk: "Logotype", berkas: "src/components/ui/logotype.tsx" },
              { untuk: "Font", berkas: "src/app/layout.tsx (next/font/google)" },
              { untuk: "Gaya bahasa & istilah", berkas: "brand-kit/MESSAGING.md" },
              { untuk: "Font untuk desain di luar kode", berkas: "brand-kit/fonts/FONTS.md" },
              { untuk: "File logo & warna mentah", berkas: "brand-kit/logo/, brand-kit/colors/" },
              { untuk: "Rumus kontras & tesnya", berkas: "src/lib/contrast.ts, src/lib/contrast.test.ts" },
            ]}
          />
        </Section>

        {/* 13 Inventaris */}
        <Section id="aset" eyebrow="13 · Inventaris Aset" title="Semua file identitas, dalam satu tabel" lede="Status setiap aset: sudah ada, dan di mana dipakai.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-text-subtle">
                  <th className="py-1.5 font-medium">Aset</th>
                  <th className="py-1.5 font-medium">Berkas</th>
                  <th className="py-1.5 font-medium">Ukuran</th>
                  <th className="py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {ASSET_INVENTORY.map((row) => (
                  <tr key={row.asset} className="border-t border-border align-top">
                    <td className="py-2 pr-3 font-medium text-text">{row.asset}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-text-muted">{row.file}</td>
                    <td className="py-2 pr-3 text-text-muted">{row.size}</td>
                    <td className="py-2 text-text-muted">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 14 Checklist */}
        <Section id="checklist" eyebrow="14 · Checklist" title="Checklist sebelum menerbitkan">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card><CardBody>
              <h4 className="font-semibold text-text">Bahasa</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-muted">
                <li>Sapaan &quot;kamu&quot; (kecuali halaman hukum)?</li>
                <li>Ada klaim yang tidak bisa dibuktikan dari data aplikasi?</li>
                <li>Istilah sesuai daftar baku?</li>
                <li>Format angka/tanggal/jam sesuai aturan?</li>
                <li>Tombol pakai kata kerja, bukan &quot;OK&quot;?</li>
                <li>Kalimat terpanjang di bawah 25 kata?</li>
              </ol>
            </CardBody></Card>
            <Card><CardBody>
              <h4 className="font-semibold text-text">Tampilan</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-muted">
                <li>Warna pakai token, bukan hex baru?</li>
                <li>Kontras teks ≥ 4,5:1 (atau ≥ 3:1 untuk teks besar)?</li>
                <li>Elemen interaktif di HP ≥ 44px?</li>
                <li>Ada padanan tema gelap?</li>
                <li>Animasi berhenti saat &quot;kurangi gerak&quot; aktif?</li>
                <li>Komponen dipakai dari <code>ui/</code>, bukan ditulis ulang?</li>
              </ol>
            </CardBody></Card>
          </div>
        </Section>

        {/* 15 Riwayat & Temuan */}
        <Section
          id="temuan"
          eyebrow="15 · Riwayat & Temuan"
          title="Yang sudah diputuskan, dan yang masih terbuka"
          lede="Saat menyusun dokumen ini, ditemukan beberapa titik di mana file brand-kit lama dan kode tidak seragam. Sebagian sudah diputuskan dan disinkronkan, dicatat di sini apa adanya."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-text-subtle">
                  <th className="py-1.5 font-medium">Temuan</th>
                  <th className="py-1.5 font-medium">Detail</th>
                  <th className="py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    t: "Ruang aman logo",
                    d: "brand-kit/README.md bilang ½ lebar tanda; guideline.html lama bilang ⅓.",
                    s: "Diputuskan: ½ untuk materi luar, ¼ untuk bilah UI (header) karena header nyatanya lebih rapat. Ditulis eksplisit di README.",
                  },
                  {
                    t: "Titik logotype: file kit vs kode",
                    d: "File SVG kit (terang) pakai #6F8F1E. Kode aplikasi pakai #9FCC1F (terang) / #BDE85A (gelap) — token brand-500.",
                    s: "Diputuskan: kode menang untuk tampilan di dalam aplikasi. File kit (cetak/materi luar) sengaja tetap #6F8F1E — ditulis eksplisit di README sebagai keputusan, bukan ketidaksengajaan.",
                  },
                  {
                    t: "Nama PWA tidak sama",
                    d: 'manifest.json: "SPH Booking" (nama pendek, muncul di layar utama HP). Metadata halaman: "Swim Private Hub".',
                    s: 'Diputuskan: wajar. "SPH Booking" memang konvensi short_name PWA (ringkas untuk ikon layar utama) — didokumentasikan, tidak diubah.',
                  },
                  {
                    t: "Warna status & teks samar: kit vs kode",
                    d: "palette.json & palette.css versi lama gagal batas kontras teks (3,4–4,1:1); aplikasi memakai versi lebih gelap (5,0–6,5:1).",
                    s: "Selesai: palette.json (25 Sep) dan palette.css (sesi ini) disinkronkan ke nilai aplikasi.",
                  },
                  {
                    t: "Tanda logo di latar gelap",
                    d: "Semua file tanda memakai air #14140F. Di latar charcoal (banner, foto profil, header gelap) bagian bawah tanda menyatu dengan latar.",
                    s: "Terbuka: belum ada varian khusus latar gelap (misal air dengan warna lebih terang atau kontur tipis). Perlu keputusan identitas — mengubahnya berarti mengubah logo di seluruh aplikasi, jadi belum dikerjakan.",
                  },
                  {
                    t: "Dokumen guideline lama",
                    d: "brand-kit/guideline.html (v1.0) dan brand-kit/brand-guideline-v2.html (draf HTML, terbukti crash browser karena gambar base64 raksasa).",
                    s: "Selesai: keduanya dihapus, digantikan halaman ini (/brandguideline) sebagai acuan utama.",
                  },
                  {
                    t: "Bayangan kartu sempat memakai warna lain",
                    d: "Sebelum diperbaiki, bayangan Card dan banner cookie memakai rgba cyan sisa desain lama.",
                    s: "Riwayat — sudah diperbaiki di kode, tidak ada tindakan lanjutan.",
                  },
                ].map((row) => (
                  <tr key={row.t} className="border-t border-border align-top">
                    <td className="py-2 pr-3 font-medium text-text">{row.t}</td>
                    <td className="py-2 pr-3 text-text-muted">{row.d}</td>
                    <td className="py-2 text-text-muted">{row.s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <SubHeading>Apa yang berubah dari versi 1.0</SubHeading>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-subtle">
                    <th className="py-1.5 font-medium">Hal</th>
                    <th className="py-1.5 font-medium">Versi 1.0</th>
                    <th className="py-1.5 font-medium">Versi 2.0</th>
                  </tr>
                </thead>
                <tbody>
                  {CHANGELOG_ROWS.map((row) => (
                    <tr key={row.hal} className="border-t border-border align-top">
                      <td className="py-2 pr-3 font-medium text-text">{row.hal}</td>
                      <td className="py-2 pr-3 text-text-muted">{row.v1}</td>
                      <td className="py-2 text-text-muted">{row.v2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      </div>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-4 text-xs text-text-subtle">
          Brand Guideline v2.0 · Swim Private Hub · Dibangun dari kode yang sungguhan berjalan, bukan dari rencana.
        </div>
      </footer>
    </main>
  );
}
