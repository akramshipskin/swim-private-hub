import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";

// Tutorial lengkap POV member, versi mobile aja (sesuai request -- gak
// ada frame desktop di sini). Urutan & copy di tiap step diverifikasi
// langsung dari kode aslinya (register/page.tsx, ganti-password/*,
// member/booking/page.tsx, dst) atau dari data akun demo yang beneran
// aktif di database -- bukan dikira-kira.

function Part({ label }: { label: string }) {
  return (
    <div className="mt-12 mb-2 flex items-center gap-3">
      <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-brand-600">{label}</p>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function Step({
  n,
  title,
  desc,
  note,
  children,
}: {
  n: number;
  title: string;
  desc?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="sm:w-64 sm:shrink-0">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {n}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-text">{title}</h3>
            {desc && <p className="mt-0.5 text-xs text-text-muted">{desc}</p>}
          </div>
        </div>
        {note && <p className="mt-2 ml-10 text-[11px] text-text-subtle sm:ml-0 sm:mt-3">{note}</p>}
      </div>
      <div className="w-full max-w-[375px] overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 p-4">{children}</div>
      </div>
    </section>
  );
}

function FakeField({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-text-muted">{label}</p>
      <div
        className={
          "flex min-h-[44px] w-full items-center rounded-xl border border-border px-3 text-sm " +
          (muted ? "bg-surface-muted text-text-muted" : "bg-surface text-text")
        }
      >
        {value}
      </div>
    </div>
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

export default function PanduanMemberView() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex flex-col items-start gap-3">
        <Image
          src="/logo.png"
          alt="Swim Private Hub"
          width={44}
          height={44}
          className="h-11 w-11 rounded-2xl object-contain shadow-sm"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Real Case &middot; Versi Mobile</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-text">
            Panduan Member Lengkap &mdash; Dari Awal Sampai Booking
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-muted">
            Urutan step + isi tiap layar di bawah diambil dari kode aplikasi &amp; data akun demo yang
            benar-benar aktif — bukan dikira-kira. Ada 2 jalur masuk (Daftar Sendiri vs Login dari akun yang
            dibikinin admin), lanjut sampai booking, riwayat, paket, dan profil. Mockup di bawah sengaja
            dibuat tampilan mobile — di dunia nyata member akses aplikasinya lewat HP.
          </p>
        </div>
      </div>

      <Part label="Jalur A &mdash; Daftar Akun Sendiri" />

      <Step n={1} title="Buka aplikasi pertama kali" desc="Belum login sama sekali.">
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl object-contain" />
          <p className="text-sm text-text"><Logotype className="text-sm" /></p>
          <p className="max-w-[220px] text-xs text-text-muted">
            Booking jadwal renang dengan coach favoritmu, kapan saja lewat HP.
          </p>
          <div className="mt-1 flex gap-2">
            <Button size="sm">Login</Button>
            <Button variant="secondary" size="sm">
              Daftar
            </Button>
          </div>
        </div>
      </Step>

      <Step n={2} title="Tap &ldquo;Daftar&rdquo;, isi form" desc="Halaman /register.">
        <FakeField label="Nama/Orang Tua" value="Bunda Sarah" />
        <FakeField label="No HP" value="0812xxxxxxx" />
        <FakeField label="Email (opsional)" value="" muted />
        <FakeField label="Password" value="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
        <div>
          <p className="mb-1 text-xs font-medium text-text-muted">Siapa yang mau les?</p>
          <div className="flex gap-2">
            <div className="flex h-[44px] w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-xs text-text">
              Anak
            </div>
            <div className="flex h-[44px] flex-1 items-center rounded-xl border border-border bg-surface px-3 text-sm text-text">
              Kirana
            </div>
          </div>
          <p className="mt-1 text-[11px] text-brand-600">+ Tambah peserta lain</p>
        </div>
        <Button className="w-full">Daftar</Button>
      </Step>

      <Step
        n={3}
        title="Otomatis login, diarahkan ke halaman Paket"
        note="Bukan ke Booking — karena akun baru belum punya paket aktif, sistem ngarahin ke Paket dulu agar beli."
      >
        <div className="rounded-xl border border-amber-200 bg-warning-bg px-3 py-2 text-xs text-warning-text">
          Belum ada paket. Pilih salah satu di bawah.
        </div>
        <p className="text-xs text-text-subtle">Beli Paket Baru</p>
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-text">Private | 8x Renang</p>
            <p className="mt-1 text-lg font-bold text-text">Rp750.000</p>
            <p className="mt-1 text-xs text-text-muted">8 Sesi &middot; Berlaku 60 Hari &middot; Jatah Batal Booking 2x</p>
            <Button className="mt-3 w-full" size="sm">
              Beli
            </Button>
          </CardBody>
        </Card>
      </Step>

      <Part label="Jalur B &mdash; Akun Dibikinin Admin (lebih umum)" />

      <Step
        n={4}
        title="Login pakai No HP + password default"
        desc="Admin sudah input data member (termasuk anak &amp; paket) lewat import xlsx atau input manual."
      >
        <FakeField label="No HP atau Email" value="0812xxxxxxx" />
        <FakeField label="Password" value="renang2026" />
        <Button className="w-full">Login</Button>
        <p className="text-[11px] text-text-subtle">Password default sama buat semua member baru: renang2026</p>
      </Step>

      <Step
        n={5}
        title="Wajib ganti password dulu"
        desc="Otomatis diarahkan ke /ganti-password, tidak bisa dilewatin sebelum ganti."
        note="Field &ldquo;Siapa yang mau les?&rdquo; tetap muncul di sini walau anaknya sudah diinput admin — itu memang alur baku form ini."
      >
        <p className="text-xs text-text-muted">Ini login pertama kamu — ganti password bawaan dulu ya.</p>
        <FakeField label="Password Baru" value="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
        <FakeField label="Konfirmasi Password Baru" value="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
        <div>
          <p className="mb-1 text-xs font-medium text-text-muted">Siapa yang mau les?</p>
          <div className="flex gap-2">
            <div className="flex h-[44px] w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-xs text-text">
              Diri sendiri
            </div>
            <div className="flex h-[44px] flex-1 items-center truncate rounded-xl border border-border bg-surface-muted px-3 text-sm text-text-muted">
              (nama kamu)
            </div>
          </div>
        </div>
        <Button className="w-full">Simpan &amp; Lanjut</Button>
      </Step>

      <Step n={6} title="Diarahkan ke halaman Booking" note="Sekarang baru masuk ke tab default member: Booking Coach.">
        <div className="flex items-center gap-2 text-brand-700">
          <span className="text-lg">&darr;</span>
          <p className="text-xs font-medium">Landing page member = Booking, bukan Paket</p>
        </div>
      </Step>

      <Part label="Booking Sesi (Lengkap)" />

      <Step
        n={7}
        title="Pilih peserta &amp; kolam"
        desc="Paket hanya berlaku di kolam tempat dibeli. Di kolam lain, member yang masih punya paket aktif bisa beli 1 sesi (muncul rincian harga &amp; aturannya sebelum bayar)."
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="flex min-h-[44px] items-center rounded-xl border border-border bg-surface px-3 text-sm text-text">Anak Satu</div>
          <div className="flex min-h-[44px] items-center rounded-xl border border-border bg-surface px-3 text-sm text-text">Kolam Renang Melati</div>
        </div>
      </Step>

      <Step
        n={8}
        title="Pilih tanggal"
        desc="8 pilihan tanggal terdekat — titik nandain ada slot ready. Butuh tanggal lebih jauh? Tap &ldquo;Pilih tanggal lain&rdquo; buat buka kalender penuh."
      >
        <div className="flex items-center justify-between text-[11px] text-text-subtle">
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-brand-500" /> ada slot ready
          </span>
          <span className="font-medium text-brand-700 underline underline-offset-2">Pilih tanggal lain</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { dow: "Sel", num: 25, active: true, dot: false },
            { dow: "Rab", num: 26, active: false, dot: true },
            { dow: "Kam", num: 27, active: false, dot: true },
            { dow: "Jum", num: 28, active: false, dot: true },
            { dow: "Sab", num: 29, active: false, dot: true },
          ].map((d) => (
            <div
              key={d.num}
              className={`relative flex h-14 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs ${
                d.active ? "border-brand-600 bg-brand-600 text-white" : "border-border bg-surface text-text"
              }`}
            >
              <span className={d.active ? "text-white/80" : "text-text-subtle"}>{d.dow}</span>
              <span className="text-sm font-semibold">{d.num}</span>
              {d.dot && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-500" />}
            </div>
          ))}
        </div>
      </Step>

      <Step n={9} title="Pilih coach &amp; jam, tap Booking">
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-700">Coach Ayu</p>
              <p className="text-sm text-text">11.00&ndash;12.00</p>
            </div>
            <Button size="sm">Booking</Button>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between opacity-60">
            <div>
              <p className="text-xs font-semibold text-brand-700">Coach Ayu</p>
              <p className="text-sm text-text">08.00&ndash;09.00</p>
            </div>
            <Badge tone="neutral">Sudah dibooking</Badge>
          </CardBody>
        </Card>
      </Step>

      <Step n={10} title="Booking berhasil" note="Sisa sesi terpotong 1, dan coach dapat notif kalau notifikasinya sudah aktif.">
        <div className="rounded-xl bg-success-bg px-3 py-2 text-xs font-medium text-success-text">
          Booking berhasil! Cek di halaman Riwayat.
        </div>
        <div className="flex min-h-[44px] items-center rounded-xl border border-border bg-surface px-3 text-sm text-text">
          Anak Satu &mdash; 8x Renang, sisa 7
        </div>
      </Step>

      <Part label="Riwayat &amp; Pembatalan" />

      <Step n={11} title="Cek Riwayat Booking">
        <Card>
          <CardBody className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                CA
              </div>
              <div>
                <p className="text-sm font-medium text-text">Coach Ayu</p>
                <p className="text-xs text-text-muted">11.00&ndash;12.00 &middot; buat Anak Satu</p>
                <Badge tone="brand">Terjadwal</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </Step>

      <Step
        n={12}
        title="Batalkan (kalau masih &ge; 2 jam sebelum jadwal)"
        note="Sisa sesi otomatis balik, tapi jatah pembatalan mandiri berkurang 1."
      >
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-text-muted">Jatah batal: 2/2 tersisa</p>
          <Button variant="danger" size="sm">
            Batalkan
          </Button>
        </div>
        <p className="text-xs text-text-subtle">Muncul konfirmasi: &ldquo;Batalkan booking ini?&rdquo; &rarr; Ya, batalkan</p>
      </Step>

      <Step
        n={13}
        title="Kalau sudah &lt; 2 jam atau jatah habis"
        note="Ini benar-benar kejadian pas didemo — booking dites live, kurang dari 2 jam sebelum jadwal."
      >
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-text-muted">Pembatalan hanya bisa minimal 2 jam sebelum jadwal.</p>
          <Button className="shrink-0 bg-success-text hover:bg-success-text/90" size="sm">
            Hubungi Admin
          </Button>
        </div>
        <p className="text-xs text-text-subtle">Klik langsung buka WhatsApp, pesannya sudah terisi otomatis.</p>
      </Step>

      <Part label="Paket" />

      <Step n={14} title="Paket Saya">
        <p className="text-[11px] text-text-subtle">Member sejak 22 Agustus 2026</p>
        <PaketCard name="8x Renang" forWhom="Anak Satu" sisa={7} total={8} berlaku="Rabu, 21 Oktober 2026" />
      </Step>

      <Step n={15} title="Beli paket tambahan" desc="Katalog dikelompokkan per kolam, lengkap dengan alamat, jam buka, fasilitas, dan harga per sesi. Pilih kolam yang paling sering kamu datangi.">
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-text">Private | 8x Renang</p>
            <p className="mt-1 text-lg font-bold text-text">Rp750.000</p>
            <div className="mt-3 flex min-h-[40px] items-center rounded-xl border border-border bg-surface px-3 text-sm text-text">
              Buat Anak Satu
            </div>
            <Button className="mt-3 w-full" size="sm">
              Beli
            </Button>
          </CardBody>
        </Card>
      </Step>

      <Part label="Kelola Profil" />

      <Step n={16} title="Ganti nama / password" desc="Halaman /profil.">
        <Field label="Nama/Orang Tua">
          <Input defaultValue="Demo Satu Anak" readOnly className="bg-surface-muted" />
        </Field>
        <Button variant="secondary" size="sm" className="w-fit">
          Simpan Nama
        </Button>
      </Step>

      <Step n={17} title="Tambah peserta di menu Peserta" desc="Tambah atau nonaktifkan peserta (kamu sendiri / anak) sekarang ada di menu Peserta, bukan di Profil.">
        <div className="flex gap-2">
          <Select disabled className="w-24 shrink-0">
            <option>Anak</option>
          </Select>
          <Input placeholder="Nama anak" className="flex-1" readOnly />
        </div>
        <Button variant="secondary" size="sm" className="w-fit">
          Tambah
        </Button>
      </Step>

      <Step n={18} title="Aktifkan notifikasi" note="Sekali aktif, dapat notif tiap booking berhasil dan tiap coach buka slot baru.">
        <button className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
          Aktifkan Notifikasi
        </button>
      </Step>

      <Step n={19} title="Butuh bantuan?" note="Pertanyaan yang tidak bisa dijawab asisten diteruskan ke admin, balasannya muncul di jendela chat yang sama.">
        <span className="inline-flex w-fit items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Butuh bantuan?
        </span>
      </Step>

      <footer className="mt-14 border-t border-border pt-6 text-xs text-text-subtle">
        Swim Private Hub &mdash; dokumentasi internal. Copy &amp; urutan tiap step diverifikasi dari kode
        aplikasi &amp; akun demo aktif per 25 Agustus 2026, diperbarui dari kode per 17 September 2026 (paket per kolam, menu Peserta, chat bantuan).
      </footer>
    </main>
  );
}
