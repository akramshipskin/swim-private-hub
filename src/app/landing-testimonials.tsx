import { Reveal } from "@/components/ui/reveal";

// Testimoni ASLI dari pengguna nyata (dengan izin mereka), diambil dari tabel
// Testimonial (dikelola di /admin/testimoni). Bagian "Kata mereka" otomatis
// tersembunyi kalau tidak ada yang tampil. Jangan mengisi contoh/dummy --
// bagian ini tampil ke publik dan ke calon pelanggan dari iklan.
export type Testimonial = { name: string; role: string; quote: string };

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  // Pita lime penuh lebar. Satu testimoni tampil besar rata kiri; dua atau
  // lebih memakai dua kolom. Tanpa kartu: teks langsung di atas pita.
  const single = items.length === 1;

  return (
    <section id="testimoni" className="relative isolate mb-14 scroll-mt-36 overflow-hidden bg-fixed-lime-100 py-14 sm:mb-20 sm:py-20 md:scroll-mt-20">
      {/* Tanda kutip besar di belakang teks (desktop): melayang pelan saat scroll. */}
      <span aria-hidden="true" className="fx-quote pointer-events-none absolute -top-10 right-10 -z-10 hidden select-none text-[22rem] font-semibold leading-none text-fixed-lime-500/25 lg:block">
        &rdquo;
      </span>
      <div className="mx-auto w-full max-w-6xl px-4">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Kata mereka</h2>
        </Reveal>
        <ul className={`mt-8 grid gap-10 ${single ? "" : "md:grid-cols-2"}`}>
          {items.map((t, i) => (
            <li key={`${t.name}-${t.role}`} className={single ? "max-w-3xl" : ""}>
              <Reveal delay={i * 100}>
              <blockquote className={`font-medium leading-snug text-fixed-ink ${single ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`}>
                “{t.quote}”
              </blockquote>
              <p className="mt-5 text-base">
                <span className="font-semibold text-fixed-ink">{t.name}</span>
                <span className="text-fixed-ink-soft">, {t.role}</span>
              </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
