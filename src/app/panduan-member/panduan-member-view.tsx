import Image from "next/image";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

// Data di bawah ini BUKAN mockup/karangan -- diambil langsung dari akun
// demo yang beneran ada & aktif di database (Demo Diri Sendiri, Demo Satu
// Anak, Demo Dua Anak, Test Member 2), per 25 Agustus 2026. Tujuannya
// nunjukin ke klien kondisi asli, bukan contoh hipotetis.

function DeviceFrame({
  label,
  maxWidth,
  children,
}: {
  label: string;
  maxWidth: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2" style={{ maxWidth }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">{label}</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="flex flex-col gap-3 p-4">{children}</div>
      </div>
    </div>
  );
}

function ScenarioBlock({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-10">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-text">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-text-muted">{desc}</p>
      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">{children}</div>
    </section>
  );
}

function PaketCard({
  name,
  forWhom,
  sisa,
  total,
  berlaku,
}: {
  name: string;
  forWhom: string;
  sisa: number;
  total: number;
  berlaku: string;
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text">{name}</p>
          <p className="text-xs text-text-subtle">buat {forWhom}</p>
          <p className="mt-1 text-xs text-text-muted">
            Sisa sesi {sisa}/{total} &middot; Berlaku sampai {berlaku}
          </p>
        </div>
        <Badge tone="success">Aktif</Badge>
      </CardBody>
    </Card>
  );
}

function RiwayatCard({
  coach,
  time,
  forWhom,
  date,
  status,
}: {
  coach: string;
  time: string;
  forWhom: string;
  date: string;
  status: "Terjadwal" | "Hadir";
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
            {coach
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{coach}</p>
            <p className="text-xs text-text-muted">
              {time} &middot; buat {forWhom}
            </p>
            <div className="mt-1">
              <Badge tone={status === "Hadir" ? "success" : "brand"}>{status}</Badge>
            </div>
          </div>
        </div>
        <p className="text-right text-[11px] text-text-subtle">{date}</p>
      </CardBody>
    </Card>
  );
}

export default function PanduanMemberView() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <div className="flex flex-col items-start gap-3">
        <Image
          src="/logo.png"
          alt="Les Renang Cianjur"
          width={48}
          height={48}
          className="h-12 w-12 rounded-2xl object-contain shadow-sm"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Real Case &middot; Bukan Mockup</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Panduan Member &mdash; Contoh dari Akun Aktif
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Semua data di halaman ini diambil dari akun demo yang beneran ada di sistem (bukan karangan) --
            biar kebayang persis apa yang bakal dilihat orang tua/member pas mereka pakai aplikasinya, di HP
            maupun di laptop.
          </p>
        </div>
      </div>

      <ScenarioBlock
        eyebrow="Skenario 1"
        title="Member dengan peserta &ldquo;Diri Sendiri&rdquo;"
        desc="Akun demo.dirisendiri@example.com -- orang tua yang ikut les sendiri, bukan buat anak."
      >
        <DeviceFrame label="Mobile" maxWidth={375}>
          <p className="text-xs text-text-subtle">Halaman Paket Saya</p>
          <PaketCard
            name="8x Renang"
            forWhom="Demo Diri Sendiri (kamu)"
            sisa={8}
            total={8}
            berlaku="Rabu, 21 Oktober 2026"
          />
          <p className="mt-2 text-xs text-text-subtle">Dropdown di halaman Booking</p>
          <div className="flex min-h-[44px] items-center rounded-xl border border-border bg-white px-3 text-sm text-text">
            Demo Diri Sendiri &mdash; 8x Renang, sisa 8
          </div>
        </DeviceFrame>
        <DeviceFrame label="Desktop" maxWidth={620}>
          <p className="text-xs text-text-subtle">Halaman Paket Saya</p>
          <div className="flex items-center justify-between">
            <PaketCard
              name="8x Renang"
              forWhom="Demo Diri Sendiri (kamu)"
              sisa={8}
              total={8}
              berlaku="Rabu, 21 Oktober 2026"
            />
            <span className="ml-3 shrink-0 text-[11px] text-text-subtle">Member sejak 22 Agustus 2026</span>
          </div>
        </DeviceFrame>
      </ScenarioBlock>

      <ScenarioBlock
        eyebrow="Skenario 2"
        title="Member dengan 1 anak"
        desc="Akun demo.satuanak@example.com -- “Anak Satu”. Contoh ini nunjukin before/after: sebelum dan sesudah beneran booking 1 sesi."
      >
        <DeviceFrame label="Mobile &mdash; sebelum booking" maxWidth={375}>
          <PaketCard name="8x Renang" forWhom="Anak Satu" sisa={8} total={8} berlaku="Rabu, 21 Oktober 2026" />
          <p className="text-xs text-text-subtle">Riwayat Booking</p>
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-text-subtle">
            Belum ada riwayat booking.
          </div>
        </DeviceFrame>
        <DeviceFrame label="Desktop &mdash; setelah booking (Sisa jatah batal: 2)" maxWidth={620}>
          <PaketCard name="8x Renang" forWhom="Anak Satu" sisa={7} total={8} berlaku="Rabu, 21 Oktober 2026" />
          <p className="text-xs text-text-subtle">Riwayat Booking</p>
          <RiwayatCard
            coach="Coach Ayu"
            time="11.00&ndash;12.00"
            forWhom="Anak Satu"
            date="Selasa, 25 Agustus 2026"
            status="Terjadwal"
          />
          <p className="text-[11px] text-text-subtle">
            Karena udah kurang dari 2 jam sebelum jadwal, tombol yang tampil &ldquo;Hubungi Admin&rdquo;, bukan
            &ldquo;Batalkan&rdquo; -- ini beneran kejadian pas booking dites live, bukan disengaja.
          </p>
        </DeviceFrame>
      </ScenarioBlock>

      <ScenarioBlock
        eyebrow="Skenario 3"
        title="Member dengan 2 anak"
        desc="Akun demo.duaanak@example.com -- “Anak Pertama” dan “Anak Kedua”, masing-masing punya paket & sisa sesi sendiri, gak ketuker."
      >
        <DeviceFrame label="Mobile" maxWidth={375}>
          <p className="text-xs text-text-subtle">Halaman Paket Saya</p>
          <PaketCard name="8x Renang" forWhom="Anak Pertama" sisa={8} total={8} berlaku="Rabu, 21 Oktober 2026" />
          <PaketCard name="8x Renang" forWhom="Anak Kedua" sisa={8} total={8} berlaku="Rabu, 21 Oktober 2026" />
        </DeviceFrame>
        <DeviceFrame label="Desktop &mdash; dropdown pilih anak di Booking" maxWidth={620}>
          <p className="text-xs text-text-subtle">Field &ldquo;Buat anak&rdquo; di halaman Booking</p>
          <div className="flex min-h-[44px] items-center rounded-xl border border-border bg-white px-3 text-sm text-text">
            Anak Kedua &mdash; 8x Renang, sisa 8
          </div>
          <div className="flex min-h-[44px] items-center rounded-xl border border-border bg-white px-3 text-sm text-text">
            Anak Pertama &mdash; 8x Renang, sisa 8
          </div>
          <p className="text-[11px] text-text-subtle">
            Satu akun, dua anak, dua paket terpisah -- booking buat Anak Pertama gak pernah motong sesi Anak
            Kedua.
          </p>
        </DeviceFrame>
      </ScenarioBlock>

      <ScenarioBlock
        eyebrow="Skenario 4"
        title="Alur beli paket dari awal (langsung di dalam app)"
        desc="Akun testmember2@example.com -- akun baru yang belum punya paket sama sekali, sampai proses beli."
      >
        <DeviceFrame label="Mobile &mdash; sebelum beli" maxWidth={375}>
          <div className="rounded-xl border border-amber-200 bg-warning-bg px-3 py-2 text-xs text-warning-text">
            Belum ada anak yang punya paket aktif dengan sisa sesi.{" "}
            <span className="font-medium underline">Beli paket dulu.</span>
          </div>
          <p className="text-xs text-text-subtle">Halaman Paket &mdash; Beli Paket Baru</p>
          <Card>
            <CardBody>
              <p className="text-sm font-semibold text-text">Private | 8x Renang</p>
              <p className="mt-1 text-lg font-bold text-text">Rp750.000</p>
              <p className="mt-1 text-xs text-text-muted">8 Sesi &middot; Berlaku 60 Hari &middot; Jatah Batal Booking 2x</p>
              <div className="mt-3 flex min-h-[40px] items-center rounded-xl border border-border bg-white px-3 text-sm text-text">
                Buat Test Member 2
              </div>
              <Button className="mt-3 w-full">Beli</Button>
            </CardBody>
          </Card>
        </DeviceFrame>
        <DeviceFrame label="Desktop &mdash; sesudah beli (contoh hasil akhir)" maxWidth={620}>
          <p className="text-xs text-text-subtle">Setelah pembayaran Midtrans berhasil</p>
          <PaketCard name="Private | 8x Renang" forWhom="Test Member 2" sisa={8} total={8} berlaku="+60 hari dari tanggal aktif" />
          <p className="text-[11px] text-text-subtle">
            Paket langsung aktif otomatis begitu Midtrans konfirmasi pembayaran sukses -- gak perlu approval
            manual dari admin.
          </p>
        </DeviceFrame>
      </ScenarioBlock>

      <ScenarioBlock
        eyebrow="Skenario 5"
        title="Kelola Profil"
        desc="Halaman /profil -- ganti nama, ganti password, tambah/nonaktifkan anak. Contoh dari akun Demo Diri Sendiri."
      >
        <DeviceFrame label="Mobile" maxWidth={375}>
          <Field label="Nama/Orang Tua">
            <Input defaultValue="Demo Diri Sendiri" readOnly className="bg-surface-muted" />
          </Field>
          <Button variant="secondary" size="sm" className="w-fit">
            Simpan Nama
          </Button>
        </DeviceFrame>
        <DeviceFrame label="Desktop" maxWidth={620}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="Nama/Orang Tua">
                <Input defaultValue="Demo Diri Sendiri" readOnly className="bg-surface-muted" />
              </Field>
            </div>
            <Button variant="secondary" size="sm">
              Simpan Nama
            </Button>
          </div>
        </DeviceFrame>
      </ScenarioBlock>

      <footer className="mt-14 border-t border-border pt-6 text-xs text-text-subtle">
        Les Renang Cianjur &mdash; dokumentasi internal, dibuat dari data akun demo yang beneran aktif di
        sistem (bukan mockup). Data per 25 Agustus 2026, bisa berubah kalau akun demo-nya dipakai lagi.
      </footer>
    </main>
  );
}
