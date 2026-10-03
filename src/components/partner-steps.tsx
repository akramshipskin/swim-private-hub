// 5 langkah jadi mitra di halaman daftar coach & kolam (Hadi 2 Okt malam, #22).
// Isinya mengikuti alur sistem yang berjalan sekarang, bukan janji baru.
const STEPS = {
  coach: [
    "Isi formulir ini (termasuk kota dan harga paketmu) dan setujui Perjanjian Kemitraan Coach.",
    "Admin SPH meninjau dan menyetujui akunmu.",
    "Lengkapi foto dan sertifikat, lalu pilih sendiri kolam mitra tempat mengajar di menu Kolam Saya.",
    "Buka jadwal di dalam jam buka kolam; member bisa membeli paket denganmu setelah ada minimal 4 jam kosong dalam 14 hari.",
    "Mengajar, tandai kehadiran, isi catatan perkembangan. Bagianmu masuk saldo dan cair paling lambat 7 hari kerja.",
  ],
  kolam: [
    "Isi formulir ini (alamat lengkap, harga tiket, kapasitas harian) dan setujui MOU Kolam Mitra.",
    "Admin SPH meninjau dan menyetujui kolammu.",
    "Lengkapi info dan foto kolam; kapasitas harian bisa diubah kapan saja.",
    "Coach di kotamu memilih kolammu dan membuka jadwal di dalam jam buka.",
    "Bagian kolam masuk saldo setiap sesi Hadir dan cair paling lambat 7 hari kerja.",
  ],
} as const;

export function PartnerSteps({ kind }: { kind: keyof typeof STEPS }) {
  return (
    <section aria-label="Langkah jadi mitra" className="mt-6 w-full max-w-sm">
      <h2 className="text-sm font-semibold text-text">5 langkah jadi mitra</h2>
      <ol className="mt-3 flex flex-col gap-2">
        {STEPS[kind].map((step, i) => (
          <li key={step} className="flex gap-3 text-sm text-text-muted">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
