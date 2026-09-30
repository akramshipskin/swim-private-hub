// Testimoni ASLI dari pengguna nyata (dengan izin mereka), diambil dari tabel
// Testimonial (dikelola di /admin/testimoni). Bagian "Kata mereka" otomatis
// tersembunyi kalau tidak ada yang tampil. Jangan mengisi contoh/dummy --
// bagian ini tampil ke publik dan ke calon pelanggan dari iklan.
export type Testimonial = { name: string; role: string; quote: string };

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  // Satu testimoni tampil lebar di tengah (bukan kartu sempit di pojok kiri
  // dengan sisa baris kosong); dua atau lebih memakai grid.
  const single = items.length === 1;

  return (
    <section id="testimoni" className="mx-auto w-full max-w-6xl scroll-mt-36 md:scroll-mt-20 px-4 pb-14 sm:pb-16">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Kata mereka</h2>
      </div>
      <ul className={single ? "mx-auto max-w-3xl" : `grid gap-6 ${items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {items.map((t) => (
          <li key={`${t.name}-${t.role}`} className="flex flex-col gap-4 rounded-3xl bg-white p-7 sm:p-9">
            <blockquote className={single ? "text-lg leading-relaxed text-fixed-ink sm:text-2xl" : "text-base text-fixed-ink"}>“{t.quote}”</blockquote>
            <p className="mt-auto text-sm">
              <span className="font-semibold text-fixed-ink">{t.name}</span>
              <span className="text-fixed-muted"> · {t.role}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
