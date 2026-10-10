import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logotype } from "@/components/ui/logotype";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Label, Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { ICONS } from "@/components/icons";
import { ThemeScope } from "./theme-scope";
import { ContrastTable } from "./contrast-table";
import { ConfirmDialogDemo } from "./confirm-dialog-demo";
import { BentoCard, NextStepCard, SegmentBar, Stat } from "@/components/dashboard";
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
  { href: "#huruf", label: "04 Huruf" },
  { href: "#bentuk", label: "05 Bentuk" },
  { href: "#komponen", label: "06 Komponen" },
  { href: "#aset", label: "07 Ikon & Aset" },
  { href: "#gerak", label: "08 Tema & Gerak" },
  { href: "#bahasa", label: "09 Bahasa" },
  { href: "#checklist", label: "10 Checklist" },
  { href: "#lampiran", label: "Lampiran" },
];

// Palet inti: porsi 60/30/10.
const CORE_COLORS = [
  { name: "Charcoal", hex: "#14140F", share: "±60%", use: "Teks utama, tombol utama, kartu utama gelap", ink: "#F6F6EE" },
  { name: "Cream", hex: "#F6F6EE", share: "±30%", use: "Latar halaman; kartu memakai putih", ink: "#14140F" },
  { name: "Lime", hex: "#C6FF3D", share: "maks 10%", use: "Aksen saja: kartu utama, layar sukses, CTA marketing, titik logotype", ink: "#14140F" },
];

// Token tema yang paling sering dipakai, terang vs gelap (nilai dari globals.css).
const THEME_TOKENS = [
  { token: "background", use: "Latar halaman", light: "#F6F6EE", dark: "#191A17" },
  { token: "surface", use: "Kartu, panel", light: "#FFFFFF", dark: "#282A25" },
  { token: "surface-muted", use: "Latar sekunder, chip", light: "#ECE9DC", dark: "#32342E" },
  { token: "border", use: "Garis tepi", light: "#DEDACA", dark: "#4A4C44" },
  { token: "text", use: "Teks utama", light: "#14140F", dark: "#E8E6DC" },
  { token: "text-muted", use: "Teks pendukung", light: "#5C5945", dark: "#B6B3A5" },
  { token: "text-subtle", use: "Keterangan kecil", light: "#6C6957", dark: "#A09D8F" },
  { token: "brand-600", use: "Tombol utama (teks putih)", light: "#14140F", dark: "#5A7A12" },
  { token: "brand-700", use: "Tautan, tombol ghost", light: "#14140F", dark: "#B9E063" },
  { token: "brand-500", use: "Cincin fokus, titik, segmen sisa sesi", light: "#9FCC1F", dark: "#BDE85A" },
  { token: "hero", use: "Kartu utama", light: "#14140F", dark: "#C6FF3D" },
  { token: "hero-accent", use: "Aksen di kartu utama", light: "#C6FF3D", dark: "#14140F" },
  { token: "success-text", use: "Status berhasil", light: "#047857", dark: "#6FD6A8" },
  { token: "warning-text", use: "Status perlu dicek", light: "#A8480A", dark: "#F2C14E" },
  { token: "danger-text", use: "Status gagal, hapus", light: "#B91C1C", dark: "#F29191" },
  { token: "accent-600", use: "Badge Populer", light: "#BE123C", dark: "#F5A8B5" },
];

// Pilihan kata ramah (Hadi 6 Okt; brand-kit/MESSAGING.md).
const FRIENDLY_WORDS = [
  ["Butir (milestone)", "Keterampilan"],
  ["Pengguna (menu admin)", "Akun"],
  ["Tipe (tambah peserta)", "Untuk Siapa"],
  ["Permintaan", "Pengajuan"],
  ["Kedaluwarsa (paket)", "Berakhir"],
  ["Pencairan / cairkan saldo", "Penarikan / Tarik Saldo"],
  ["Rekening Tujuan Pencairan", "Rekening Penerima"],
  ["Perlu tindakan", "Perlu Kamu Cek"],
  ["Tambah Slot", "Buka Jam Kosong"],
];

const BASE_TERMS = [
  ["Member", "pelanggan, customer, user"],
  ["Peserta", "murid, anak (kecuali memang khusus anak)"],
  ["Coach", "pelatih, instruktur, trainer"],
  ["Kolam mitra / Pemilik kolam", "partner, vendor, owner"],
  ["Paket, Sesi", "membership, langganan, pertemuan"],
  ["Jatah Batal", "kuota cancel"],
  ["Saldo, Tarik Saldo", "wallet, withdraw, tarik dana"],
  ["Ditandai Hadir / Tidak Hadir", "absen, check-in, bolos"],
  ["Booking, Batalkan", "reservasi, cancel"],
  ["Biaya layanan SPH", "fee, komisi (untuk member)"],
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
          ? "rounded-xl border border-warning-text/25 bg-warning-bg p-3 text-sm text-warning-text sm:p-4"
          : "rounded-xl border border-border bg-surface-muted p-3 text-sm text-text-muted sm:p-4"
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

function Table({ head, rows, mono = [] }: { head: string[]; rows: ReactNode[][]; mono?: number[] }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${head.length > 2 ? "min-w-[520px]" : ""}`}>
        <thead>
          <tr className="text-left text-xs text-text-subtle">
            {head.map((h) => (
              <th key={h} className="py-1.5 pr-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border align-top">
              {row.map((cell, j) => (
                <td key={j} className={j === 0 ? "py-2 pr-3 font-medium text-text" : mono.includes(j) ? "py-2 pr-3 font-mono text-xs text-text-muted" : "py-2 pr-3 text-text-muted"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Fold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text max-lg:min-h-[44px]">
        {title}
        <span aria-hidden className="text-text-subtle transition-transform duration-200 group-open:rotate-180">⌄</span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}

function Swatch({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="h-5 w-5 shrink-0 rounded-md border border-border/60" style={{ background: hex }} />
      <span className="font-mono text-xs uppercase">{hex}</span>
    </span>
  );
}

export default function BrandGuidelineView() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 max-lg:min-h-[44px]">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
            <Logotype className="text-sm" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center"
          >
            ← Beranda
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Sampul */}
        <span className="text-xs font-bold uppercase tracking-wide text-brand-700">Swim Private Hub · Brand Guideline</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text text-wrap-balance sm:text-4xl">Lime Pulse</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
          Acuan untuk semua yang dilihat dan dibaca pengguna: logo, warna, huruf, bentuk, komponen, gerak, dan bahasa.
          Semua contoh di halaman ini memakai komponen dan warna yang sama dengan aplikasi, jadi tampilannya selalu ikut
          aplikasi.
        </p>
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-subtle">
          <div><dt className="inline font-medium text-text">Versi: </dt><dd className="inline">2.1 (10 Oktober 2026)</dd></div>
          <div><dt className="inline font-medium text-text">Palet: </dt><dd className="inline">Charcoal · Cream · Lime</dd></div>
          <div><dt className="inline font-medium text-text">Logotype: </dt><dd className="inline font-mono">swim.privatehub</dd></div>
        </dl>

        <nav aria-label="Daftar bagian" className="mt-6 mb-10 flex flex-wrap gap-2">
          {TOC.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted hover:border-brand-500 hover:text-text max-lg:min-h-[44px] max-lg:inline-flex max-lg:items-center"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 01 Esensi */}
        <Section
          id="esensi"
          eyebrow="01 · Esensi"
          title="Tenang, modern, dan bisa dipercaya"
          lede="Aplikasi les renang privat. Pilih coach, pilih kolam, dan pilih jamnya. Anak atau kamu belajar berenang dengan coach pilihan sendiri, di kolam mitra Swim Private Hub. Perkembangan tercatat, pembayaran jelas."
        >
          <Table
            head={["Unsur", "Nilai", "Aturan"]}
            mono={[1]}
            rows={[
              ["Nama lengkap", "Swim Private Hub", "Kapital di awal tiap kata. Untuk teks biasa, judul halaman, dokumen hukum"],
              ["Logotype", "swim.privatehub", "Huruf kecil, satu kata, titik lime. Hanya saat nama tampil sebagai logo"],
              ["Nama di layar utama HP", "SPH Booking", "Nama pendek ikon aplikasi; di tempat lain pakai nama lengkap"],
              ["Domain", "swimprivatehub.biz.id", "Alamat situs dan email"],
              ["Bahasa", "Indonesia", "Semua teks pengguna berbahasa Indonesia"],
            ]}
          />
          <Note title="Kalau ada yang berbeda">
            Yang berlaku adalah tampilan aplikasi. Halaman ini di urutan kedua, file lama di folder brand-kit di urutan
            ketiga. Kalau contoh di sini berbeda dari aplikasi, yang perlu diperbaiki halaman ini.
          </Note>
        </Section>

        {/* 02 Logo */}
        <Section
          id="logo"
          eyebrow="02 · Logo"
          title="Tanda, lockup, dan cara pakainya"
          lede="Tanda (kotak membulat dengan gelombang) dan logotype boleh dipakai bersama atau terpisah. Warna tanda tidak pernah dibalik mengikuti latar."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-muted p-6 text-center">
              <Image src="/logo.png" alt="Tanda Swim Private Hub" width={96} height={96} className="h-20 w-20 rounded-2xl object-contain" />
              <p className="mt-3 text-xs text-text-subtle">Tanda, dipakai di header aplikasi</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <Image src="/brand-kit/logo/png/lockup-on-light-8320x1920.png" alt="Lockup swim.privatehub di latar terang" width={8320} height={1920} className="h-auto w-full max-w-[280px]" />
                <p className="mt-2 text-xs text-text-subtle">Lockup untuk latar terang</p>
              </div>
              <div className="rounded-2xl border border-border bg-fixed-ink p-4">
                <Image src="/brand-kit/logo/png/lockup-on-dark-8320x1920.png" alt="Lockup swim.privatehub di latar gelap" width={8320} height={1920} className="h-auto w-full max-w-[280px]" />
                <p className="mt-2 text-xs text-white/70">Lockup untuk latar charcoal</p>
              </div>
            </div>
          </div>

          <div>
            <SubHeading>Varian tanda</SubHeading>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { src: "/brand-kit/logo/svg/mark-lime.svg", label: "Lime (utama)", bg: "bg-surface", text: "text-text-subtle" },
                { src: "/brand-kit/logo/svg/mark-cream.svg", label: "Cream, di atas lime", bg: "bg-fixed-lime", text: "text-fixed-ink" },
                { src: "/brand-kit/logo/svg/mark-white-mono.svg", label: "Putih satu warna, cetak", bg: "bg-fixed-ink", text: "text-white/70" },
              ].map((m) => (
                <div key={m.label} className={`flex flex-col items-center gap-2 rounded-xl border border-border ${m.bg} p-3`}>
                  <Image src={m.src} alt="" width={40} height={40} className="h-10 w-10" />
                  <span className={`text-center text-xs ${m.text}`}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Note title="Lakukan">
              <ul className="mt-1 list-disc pl-4 sm:pl-5">
                <li>Langit lime di atas, air charcoal di bawah.</li>
                <li>Di aplikasi: tanda + logotype berdampingan (header, masuk/daftar, footer).</li>
                <li>Ruang kosong di sekeliling: ½ lebar tanda di materi luar, ¼ di header aplikasi.</li>
                <li>Satu tanda untuk semua latar; hanya warna tulisan logotype yang ikut tema.</li>
              </ul>
            </Note>
            <Note tone="warning" title="Jangan">
              <ul className="mt-1 list-disc pl-4 sm:pl-5">
                <li>Membalik atau memutar tanda.</li>
                <li>Mengganti warna, rasio, atau jarak huruf.</li>
                <li>Menambah bayangan, efek 3D, atau gradien.</li>
                <li>Memakai tanda saja tanpa nama, kecuali ikon aplikasi.</li>
              </ul>
            </Note>
          </div>
        </Section>

        {/* 03 Warna */}
        <Section
          id="warna"
          eyebrow="03 · Warna"
          title="Charcoal, cream, dan sedikit lime"
          lede="Charcoal mendominasi, cream memberi ruang, lime hanya untuk menarik perhatian. Tombol utama di aplikasi berwarna charcoal, bukan lime."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {CORE_COLORS.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="flex h-28 items-end justify-between p-4" style={{ background: c.hex, color: c.ink }}>
                  <span className="text-lg font-semibold">{c.name}</span>
                  <span className="text-xs font-semibold">{c.share}</span>
                </div>
                <div className="p-4">
                  <div className="font-mono text-xs uppercase text-text-subtle">{c.hex}</div>
                  <p className="mt-1 text-sm text-text-muted">{c.use}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <SubHeading>Warna di aplikasi, terang dan gelap</SubHeading>
            <p className="mt-1 text-sm text-text-muted">Setiap warna punya satu nama yang sama di kedua tema. Nilai gelapnya diatur terpisah supaya tetap terbaca.</p>
            <div className="mt-3">
              <Table
                head={["Nama", "Dipakai untuk", "Terang", "Gelap"]}
                rows={THEME_TOKENS.map((t) => [<span key="n" className="font-mono text-xs">{t.token}</span>, t.use, <Swatch key="l" hex={t.light} />, <Swatch key="d" hex={t.dark} />])}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Note title="Lime boleh untuk">
              <ul className="mt-1 list-disc pl-4 sm:pl-5">
                <li>Aksen dan tombol di kartu utama gelap (dasbor) dan layar sukses</li>
                <li>Cincin fokus, titik kalender, segmen sisa sesi</li>
                <li>Tombol CTA di halaman marketing (landing, panduan)</li>
                <li>Titik di logotype</li>
              </ul>
            </Note>
            <Note tone="warning" title="Lime tidak boleh untuk">
              <ul className="mt-1 list-disc pl-4 sm:pl-5">
                <li>Tombol utama di dalam aplikasi (pakai charcoal)</li>
                <li>Warna teks di latar terang (tidak terbaca)</li>
                <li>Latar halaman atau kartu biasa</li>
              </ul>
            </Note>
          </div>

          <div>
            <SubHeading>Warna halaman marketing</SubHeading>
            <p className="mt-1 text-sm text-text-muted">Landing, panduan, dan halaman hukum tampil sama di tema terang dan gelap, memakai warna tetap berikut.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FIXED_TOKENS.map((t) => (
                <TokenSwatch key={t.name} name={t.name} hex={t.hex} use={t.use} />
              ))}
            </div>
          </div>

          <Fold title="Angka keterbacaan warna (kontras)">
            <p className="text-sm text-text-muted">
              Dihitung dari kode warna dengan rumus standar WCAG. Batas: teks minimal 4,5:1, teks besar dan bentuk minimal 3:1.
            </p>
            <SubHeading>Tema terang</SubHeading>
            <ContrastTable pairs={LIGHT_CONTRAST_PAIRS} />
            <SubHeading>Tema gelap</SubHeading>
            <ContrastTable pairs={DARK_CONTRAST_PAIRS} />
          </Fold>
        </Section>

        {/* 04 Huruf */}
        <Section
          id="huruf"
          eyebrow="04 · Huruf"
          title="Sora untuk judul, Plus Jakarta Sans untuk isi"
          lede="Satu huruf untuk judul, satu untuk isi, satu untuk kode dan nomor referensi."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardBody>
              <div className="text-xs font-medium uppercase tracking-wide text-text-subtle">Judul & logotype</div>
              <div className="mt-1 font-heading text-2xl font-bold text-text">Sora</div>
              <p className="mt-1 text-xs text-text-muted">Geometris, berkarakter. Tebal 600–800.</p>
            </CardBody></Card>
            <Card><CardBody>
              <div className="text-xs font-medium uppercase tracking-wide text-text-subtle">Isi & tampilan</div>
              <div className="mt-1 font-sans text-2xl font-bold text-text">Plus Jakarta Sans</div>
              <p className="mt-1 text-xs text-text-muted">Mudah dibaca di HP. Tebal 400–700.</p>
            </CardBody></Card>
            <Card><CardBody>
              <div className="text-xs font-medium uppercase tracking-wide text-text-subtle">Kode & nomor</div>
              <div className="mt-1 font-mono text-2xl font-bold text-text">JetBrains Mono</div>
              <p className="mt-1 text-xs text-text-muted">Kode booking, nomor referensi. Tebal 500–600.</p>
            </CardBody></Card>
          </div>

          <div>
            <SubHeading>Ukuran yang dipakai</SubHeading>
            <div className="mt-3 flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
              {[
                { cls: "text-4xl font-semibold", sample: "Aplikasi les renang privat", meta: "36 px di HP, 60 px di layar lebar · judul landing" },
                { cls: "text-2xl font-semibold", sample: "Riwayat Bayar", meta: "24 px · judul halaman" },
                { cls: "text-xl font-semibold", sample: "Masuk ke akunmu", meta: "20 px · judul kartu masuk/daftar" },
                { cls: "text-lg font-semibold", sample: "Paket Aktif", meta: "18 px · judul bagian" },
                { cls: "text-sm font-normal font-sans", sample: "Teks standar: tombol, isian, paragraf kartu", meta: "14 px · ukuran dasar" },
                { cls: "text-xs font-medium font-sans", sample: "Label, badge, keterangan kecil", meta: "12 px · paling kecil" },
              ].map((row) => (
                <div key={row.meta} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className={`${row.cls} text-text`}>{row.sample}</span>
                  <span className="shrink-0 text-xs text-text-subtle">{row.meta}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 05 Bentuk */}
        <Section
          id="bentuk"
          eyebrow="05 · Bentuk & Tata Letak"
          title="Sudut membulat, garis tipis, ruang lega"
          lede="Satu skala sudut dan jarak untuk semua halaman dan semua peran."
        >
          <Table
            head={["Unsur", "Nilai", "Dipakai di"]}
            mono={[1]}
            rows={[
              ["Sudut kecil", "8 px", "Chip, tombol kecil"],
              ["Sudut standar", "12 px", "Tombol, isian, dialog"],
              ["Sudut kartu", "16 px", "Kartu, panel"],
              ["Sudut besar", "24 px", "Kartu dasbor (bento), kartu utama, kartu landing"],
              ["Pil", "penuh", "Badge, filter, CTA marketing"],
              ["Isi kartu", "16 px (HP) / 20 px", "Jarak dalam kartu"],
              ["Tepi halaman", "16 px (HP) / 32 px (desktop)", "Kiri-kanan konten"],
              ["Area sentuh di HP", "minimal 44 × 44 px", "Tombol, tautan mandiri, isian"],
            ]}
          />
          <Note title="Kerangka halaman">
            Desktop: menu di samping kiri, isi dasbor berupa kotak-kotak (bento) dalam 6 kolom. HP: kepala halaman berisi logo
            dan lonceng, bilah bawah 4 menu + Lainnya, isi satu kolom, tombol utama halaman panjang menempel di bawah.
          </Note>
        </Section>

        {/* 06 Komponen */}
        <Section
          id="komponen"
          eyebrow="06 · Komponen"
          title="Satu bentuk untuk tiap komponen"
          lede="Semua contoh di bawah adalah komponen aplikasi yang asli, ditampilkan terang dan gelap berdampingan."
        >
          <div>
            <SubHeading>Kartu utama (dasbor)</SubHeading>
            <p className="mt-1 text-sm text-text-muted">Satu tindakan terpenting per peran. Terang: charcoal dengan aksen lime. Gelap: lime penuh dengan teks charcoal.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["light", "dark"] as const).map((theme) => (
                <ThemeScope key={theme} theme={theme}>
                  <NextStepCard
                    eyebrow="Jadwal berikutnya"
                    badge="dalam 1 hari"
                    kicker="Sabtu, 11 Okt"
                    title="08.00–09.00"
                    body="Alya · Kolam Renang Melati · dengan Coach Dimas"
                    href="#komponen"
                    cta="Booking Sesi Lain"
                  >
                    <SegmentBar sisa={5} total={8} tone="hero" className="mt-4" />
                  </NextStepCard>
                </ThemeScope>
              ))}
            </div>
          </div>

          <div>
            <SubHeading>Kotak dasbor, angka, dan segmen sisa sesi</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["light", "dark"] as const).map((theme) => (
                <ThemeScope key={theme} theme={theme}>
                  <BentoCard title="Ringkasan" href="#komponen">
                    <div className="grid grid-cols-2 gap-4">
                      <Stat label="Paket Aktif" value={1} hint="2 peserta terdaftar" />
                      <Stat label="Sesi Belum Ditandai" value={2} tone="warning" />
                    </div>
                    <SegmentBar sisa={5} total={8} className="mt-4" />
                    <p className="mt-1 text-xs text-text-subtle">Sisa 5 dari 8 sesi</p>
                  </BentoCard>
                </ThemeScope>
              ))}
            </div>
          </div>

          <div>
            <SubHeading>Tombol</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["light", "dark"] as const).map((theme) => (
                <ThemeScope key={theme} theme={theme}>
                  <div className="flex flex-wrap gap-2">
                    <Button>Simpan</Button>
                    <Button disabled>Simpan</Button>
                    <Button loading>Menyimpan</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary">Batal</Button>
                    <Button variant="danger">Nonaktifkan</Button>
                    <Button variant="ghost">Lihat Semua</Button>
                    <Button size="sm">Ubah</Button>
                  </div>
                </ThemeScope>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-subtle">Urutan: utama (charcoal) untuk satu tindakan terpenting, sekunder untuk pilihan lain, bahaya hanya untuk tindakan yang tidak bisa dibatalkan.</p>
          </div>

          <div>
            <SubHeading>Badge status</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["light", "dark"] as const).map((theme) => (
                <ThemeScope key={theme} theme={theme}>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="success">Aktif</Badge>
                    <Badge tone="warning">Menunggu Persetujuan</Badge>
                    <Badge tone="danger">Nonaktif</Badge>
                    <Badge tone="neutral">Dibatalkan</Badge>
                    <Badge tone="brand">Paket 4×</Badge>
                    <Badge tone="accent">Populer</Badge>
                  </div>
                </ThemeScope>
              ))}
            </div>
          </div>

          <div>
            <SubHeading>Isian formulir</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["light", "dark"] as const).map((theme) => (
                <ThemeScope key={theme} theme={theme}>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`bg-demo-name-${theme}`}>Nama Lengkap</Label>
                    <Input id={`bg-demo-name-${theme}`} placeholder="Nama kamu" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`bg-demo-filled-${theme}`}>Nomor HP</Label>
                    <Input id={`bg-demo-filled-${theme}`} defaultValue="0812 3456 7890" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`bg-demo-disabled-${theme}`}>Kota Domisili</Label>
                    <Input id={`bg-demo-disabled-${theme}`} defaultValue="Bandung" disabled />
                  </div>
                </ThemeScope>
              ))}
            </div>
          </div>

          <div>
            <SubHeading>Kartu biasa</SubHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["light", "dark"] as const).map((theme) => (
                <ThemeScope key={theme} theme={theme}>
                  <Card><CardBody>
                    <h4 className="font-semibold text-text">Kolam Renang Melati</h4>
                    <p className="mt-0.5 text-xs text-text-muted">Sisa sesi 6 · Jatah Batal 2</p>
                  </CardBody></Card>
                </ThemeScope>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
              <SubHeading>Dialog konfirmasi</SubHeading>
              <p className="text-xs text-text-muted">Untuk tindakan berisiko. Menyebut akibatnya; Esc menutup.</p>
              <ConfirmDialogDemo />
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
              <SubHeading>Tanda memuat</SubHeading>
              <p className="text-xs text-text-muted">Satu-satunya tanda memuat di aplikasi.</p>
              <Loader size={20} label="Memuat" />
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
              <SubHeading>Foto profil</SubHeading>
              <p className="text-xs text-text-muted">Siluet bawaan sebelum foto diunggah.</p>
              <Avatar className="h-12 w-12" />
            </div>
          </div>
        </Section>

        {/* 07 Ikon & Aset */}
        <Section
          id="aset"
          eyebrow="07 · Ikon & Aset"
          title="Ikon garis tipis, aset siap pakai"
          lede="Ikon dibuat sendiri dalam satu gaya garis dan selalu mengikuti warna teks di sekitarnya."
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Object.entries(ICONS).map(([name, Icon]) => (
              <div key={name} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3">
                <Icon className="h-6 w-6 text-text" />
                <span className="text-center font-mono text-xs text-text-subtle">{name}</span>
              </div>
            ))}
          </div>

          <div>
            <SubHeading>Ikon aplikasi</SubHeading>
            <div className="mt-3 flex flex-wrap items-end gap-5">
              {[
                { src: "/icon-192.png", label: "Layar utama HP" },
                { src: "/apple-icon.png", label: "iPhone" },
                { src: "/logo.png", label: "Header aplikasi" },
              ].map((i) => (
                <div key={i.src} className="flex flex-col items-center gap-1.5">
                  <Image src={i.src} alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
                  <span className="text-xs text-text-subtle">{i.label}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- favicon.ico bukan format yang didukung next/image */}
                <img src="/favicon.ico" alt="" width={32} height={32} className="h-8 w-8" />
                <span className="text-xs text-text-subtle">Tab browser</span>
              </div>
            </div>
          </div>

          <div>
            <SubHeading>Media sosial</SubHeading>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <Image src="/brand-kit/social/profile-picture-2000.png" alt="Foto profil sosial Swim Private Hub" width={2000} height={2000} className="mx-auto h-auto w-full max-w-[200px] rounded-full" />
                <p className="mt-2 text-xs text-text-subtle">Foto profil (2000 × 2000)</p>
              </div>
              <div className="flex flex-col gap-3 sm:col-span-2">
                <div>
                  <Image src="/brand-kit/social/banner-linkedin-6336x1584.png" alt="Banner LinkedIn Swim Private Hub" width={6336} height={1584} className="h-auto w-full rounded-lg border border-border" />
                  <p className="mt-2 text-xs text-text-subtle">Banner LinkedIn</p>
                </div>
                <div>
                  <Image src="/brand-kit/social/banner-square-6000x2000.png" alt="Banner Swim Private Hub untuk Instagram dan X" width={6000} height={2000} className="h-auto w-full rounded-lg border border-border" />
                  <p className="mt-2 text-xs text-text-subtle">Banner Instagram dan X</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-text-muted">Gambar pratinjau saat tautan dibagikan di WhatsApp atau media sosial dibuat otomatis oleh aplikasi.</p>
          </div>
        </Section>

        {/* 08 Tema & Gerak */}
        <Section
          id="gerak"
          eyebrow="08 · Tema, Gerak & Aksesibilitas"
          title="Nyaman di terang, gelap, dan di HP"
          lede="Aplikasi punya tema terang dan gelap penuh. Gerak dipakai seperlunya dan berhenti bila pengguna memintanya."
        >
          <Table
            head={["Hal", "Aturan"]}
            rows={[
              ["Tema gelap", "Bukan dibalik: tiap warna punya nilai gelap sendiri yang sudah diukur keterbacaannya (bagian 3)"],
              ["Gerak di HP", "Ringan: kartu dan bagian muncul pelan saat masuk layar, sekali saja. Tanpa efek arahkan kursor"],
              ["Gerak di desktop", "Boleh lebih kaya: efek arahkan kursor, muncul bertahap, video di kepala landing"],
              ["Kecepatan gerak", "150–300 md untuk aplikasi, 400–700 md untuk landing; hanya geser dan pudar"],
              ["Kurangi gerak", "Semua gerak mati bila \"Kurangi Gerak\" aktif di HP atau komputer pengguna; isi tetap tampil"],
              ["Keterbacaan", "Teks minimal 4,5:1, teks besar minimal 3:1"],
              ["Keyboard", "Cincin fokus lime di semua yang bisa diklik; dialog bisa ditutup dengan Esc"],
              ["Label", "Semua isian punya label; tombol ikon punya nama untuk pembaca layar"],
            ]}
          />
        </Section>

        {/* 09 Bahasa */}
        <Section
          id="bahasa"
          eyebrow="09 · Bahasa"
          title="Seperti coach yang bisa dipercaya, bukan sales"
          lede='Sapa dengan "kamu". Tulis apa adanya dan sebut akibatnya untuk pengguna, bukan istilah teknis. Ramah, tapi tidak gaul.'
        >
          <Card><CardBody>
            <h4 className="text-sm font-medium text-text-subtle">Headline, subheadline, dan tagline resmi</h4>
            <p className="mt-2 text-lg font-semibold text-text">Aplikasi les renang privat. Pilih coach, pilih kolam, dan pilih jamnya.</p>
            <p className="mt-1 text-sm text-text-muted">Anak atau kamu belajar berenang dengan coach pilihan sendiri, di kolam mitra Swim Private Hub. Perkembangan tercatat, pembayaran jelas.</p>
            <p className="mt-2 text-xs text-text-subtle">
              Dipakai sama persis di landing, panduan, footer, masuk/daftar, gambar berbagi, dan banner. &quot;Pilih jam&quot; artinya
              dari jam kosong coach; jangan tulis &quot;bebas pilih jadwal&quot;, &quot;pertama&quot;, atau &quot;nomor 1&quot;.
            </p>
          </CardBody></Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Note title="Huruf kapital">
              <ul className="mt-1 list-disc pl-4 sm:pl-5">
                <li>Tombol dan label di aplikasi: Title Case, contoh &quot;Simpan Perubahan&quot;, &quot;Tanggal Lahir&quot;, &quot;Ya, Batalkan&quot;.</li>
                <li>Kata sambung tetap kecil: di, ke, dari, dan, atau, yang, untuk, dengan, pada.</li>
                <li>Kalimat penuh dan judul bagian: huruf besar hanya di awal.</li>
                <li>Nama menu sama persis dengan judul halamannya.</li>
              </ul>
            </Note>
            <Note title="Angka dan waktu">
              <ul className="mt-1 list-disc pl-4 sm:pl-5">
                <li>Rupiah: Rp 1.650.000 (titik, tanpa desimal).</li>
                <li>Tanggal: 18 September 2026 atau 18 Sep 2026.</li>
                <li>Jam sesi: 08.00–09.00. Waktu selalu WIB.</li>
                <li>Persen: 15% tanpa spasi.</li>
              </ul>
            </Note>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="min-w-0">
              <SubHeading>Istilah baku</SubHeading>
              <div className="mt-3"><Table head={["Pakai", "Jangan"]} rows={BASE_TERMS} /></div>
            </div>
            <div className="min-w-0">
              <SubHeading>Kata yang lebih ramah (6 Okt 2026)</SubHeading>
              <div className="mt-3"><Table head={["Dulu", "Sekarang"]} rows={FRIENDLY_WORDS} /></div>
            </div>
          </div>
          <p className="text-xs text-text-subtle">
            Halaman hukum (Syarat & Ketentuan, Kebijakan Privasi, perjanjian) memakai bahasa formal dan &quot;Pengguna&quot;, dan masih
            menyebut &quot;pencairan&quot;. Aturan lengkap ada di panduan tulisan (brand-kit/MESSAGING.md).
          </p>
        </Section>

        {/* 10 Checklist */}
        <Section id="checklist" eyebrow="10 · Checklist" title="Sebelum menerbitkan">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card><CardBody>
              <h4 className="font-semibold text-text">Tulisan</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-muted">
                <li>Sapaan &quot;kamu&quot; (kecuali halaman hukum)?</li>
                <li>Tidak ada klaim yang tidak bisa dibuktikan dari data aplikasi?</li>
                <li>Istilah sesuai daftar baku dan kata ramah?</li>
                <li>Tombol dan label Title Case, memakai kata kerja (bukan &quot;OK&quot;)?</li>
                <li>Format rupiah, tanggal, dan jam sesuai aturan?</li>
                <li>Kalimat terpanjang di bawah 25 kata?</li>
              </ol>
            </CardBody></Card>
            <Card><CardBody>
              <h4 className="font-semibold text-text">Tampilan</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-muted">
                <li>Warna dari palet, bukan warna baru?</li>
                <li>Tombol utama charcoal, lime hanya aksen?</li>
                <li>Teks terbaca (kontras cukup) di terang dan gelap?</li>
                <li>Area sentuh di HP minimal 44 px?</li>
                <li>Dicek di lebar 375, 768, dan 1280 px tanpa geser samping?</li>
                <li>Gerak berhenti saat &quot;Kurangi Gerak&quot; aktif?</li>
              </ol>
            </CardBody></Card>
          </div>
        </Section>

        {/* Lampiran */}
        <Section id="lampiran" eyebrow="Lampiran" title="Catatan teknis dan riwayat" lede="Untuk pengembang dan arsip. Tidak perlu dibaca untuk memakai brand.">
          <Fold title="A. Untuk pengembang: file yang dipakai">
            <DevFileTable
              rows={[
                { untuk: "Token warna & tema", berkas: "src/app/globals.css" },
                { untuk: "Komponen dasar", berkas: "src/components/ui/*.tsx" },
                { untuk: "Kartu utama, kotak dasbor, segmen sesi", berkas: "src/components/dashboard.tsx" },
                { untuk: "Kerangka halaman & navigasi", berkas: "src/components/nav-bar.tsx, sidebar-nav.tsx, mobile-bottom-nav.tsx, src/lib/nav-links.ts" },
                { untuk: "Ikon", berkas: "src/components/icons.tsx" },
                { untuk: "Logotype", berkas: "src/components/ui/logotype.tsx" },
                { untuk: "Font", berkas: "src/app/layout.tsx (next/font/google)" },
                { untuk: "Gaya bahasa & istilah", berkas: "brand-kit/MESSAGING.md" },
                { untuk: "File logo, warna, font untuk desain di luar kode", berkas: "brand-kit/logo/, brand-kit/colors/, brand-kit/fonts/FONTS.md" },
                { untuk: "Contoh terang/gelap di halaman ini", berkas: "src/app/brandguideline/theme-scope.tsx (dijaga tes theme-scope.test.ts)" },
                { untuk: "Rumus kontras", berkas: "src/lib/contrast.ts" },
              ]}
            />
            <Note tone="warning" title="Catatan CSS">
              Jangan memakai <code>text-wrap</code> (shorthand) di CSS global di luar <code>@layer</code>: menimpa{" "}
              <code>truncate</code> dan <code>whitespace-nowrap</code>. Pakai <code>text-wrap-style</code>. Pakai token warna, bukan hex
              atau kelas warna mentah; tautan berpenampilan tombol memakai <code>buttonClass()</code>, bukan &lt;a&gt; membungkus &lt;button&gt;.
            </Note>
          </Fold>

          <Fold title="B. Daftar file aset">
            <Table head={["Aset", "File", "Ukuran", "Status"]} mono={[1]} rows={ASSET_INVENTORY.map((r) => [r.asset, r.file, r.size, r.status])} />
          </Fold>

          <Fold title="C. Keputusan dan riwayat perubahan">
            <Table
              head={["Hal", "Keputusan"]}
              rows={[
                ["Ruang aman logo", "½ lebar tanda untuk materi luar, ¼ untuk header aplikasi"],
                ["Titik logotype", "File cetak memakai #6F8F1E; aplikasi memakai lime brand-500. Disengaja"],
                ["Nama di layar utama HP", "\"SPH Booking\" (nama pendek ikon); tempat lain \"Swim Private Hub\""],
                ["Tanda di latar gelap", "Satu tanda untuk semua latar (Hadi 30 Sep 2026); hanya tulisan logotype yang ikut tema"],
                ["Tombol utama", "Charcoal; lime hanya kartu utama gelap dan layar sukses (Hadi 4 Okt 2026)"],
                ["Kata ramah dan Title Case", "Berlaku di semua teks aplikasi (Hadi 6 Okt 2026); teks hukum tidak diubah"],
                ["Dokumen lama", "guideline.html dan brand-guideline-v2.html dihapus, digantikan halaman ini"],
                ["Aset resolusi tinggi", "Tanda 4096 px, lockup 8320 × 1920, aset sosial 4× (selesai)"],
              ]}
            />
            <SubHeading>Versi 1.0 → 2.0</SubHeading>
            <Table head={["Hal", "Versi 1.0", "Versi 2.0"]} rows={CHANGELOG_ROWS.map((r) => [r.hal, r.v1, r.v2])} />
            <SubHeading>Warna lama yang diganti karena kurang terbaca</SubHeading>
            <ContrastTable pairs={OLD_KIT_CONTRAST_PAIRS} />
          </Fold>
        </Section>
      </div>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-4 text-xs text-text-subtle">
          Brand Guideline 2.1 · Swim Private Hub · Contoh di halaman ini memakai komponen aplikasi yang sama.
        </div>
      </footer>
    </main>
  );
}
