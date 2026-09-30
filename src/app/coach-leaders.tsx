import Link from "next/link";
import type { LandingCoach } from "./landing-view";
import { Rail, RAIL_ITEM_FIVE } from "./landing-rail";

// Kartu coach ringkas (dulu: kartu polaroid miring setinggi 36rem, ditumpuk satu
// per baris = ±3000px hampir kosong). Sekarang barisan kartu yang bisa digeser
// (lihat Rail). Info lengkap tiap coach ada di /pelatih/[id].
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function CoachCard({ c }: { c: LandingCoach }) {
  return (
    <li className={RAIL_ITEM_FIVE}>
      <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-fixed-lime-100">
          {c.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.photoUrl} alt={`Foto ${c.name}`} loading="lazy" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_80%_10%,rgba(159,204,31,0.5),transparent_60%),linear-gradient(135deg,#e3f5b0,#c6e86a)]">
              <span aria-hidden="true" className="text-5xl font-semibold tracking-tight text-fixed-ink/70">{initials(c.name)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {c.specialties[0] && <p className="text-xs font-semibold uppercase tracking-wide text-fixed-muted">{c.specialties[0]}</p>}
          <h3 className="text-lg font-semibold leading-tight text-fixed-ink">{c.name}</h3>
          {c.bioLine && <p className="text-sm text-fixed-muted">{c.bioLine}</p>}
          {c.certifiedLabel && (
            <p className="mt-1">
              <span className="inline-block rounded-full bg-fixed-lime-100 px-3 py-1 text-xs font-semibold text-fixed-ink">{c.certifiedLabel}</span>
            </p>
          )}
          <p className="mt-1 text-sm text-fixed-muted">
            Mengajar di: <span className="font-medium text-fixed-ink">{c.pools.length === 0 ? "-" : c.pools.length > 2 ? `${c.pools.slice(0, 2).join(", ")} +${c.pools.length - 2}` : c.pools.join(", ")}</span>
          </p>
          <Link href={`/pelatih/${c.id}`} className="mt-auto inline-flex min-h-[44px] items-center pt-2 text-sm font-semibold text-fixed-ink underline">
            Lihat profil lengkap
          </Link>
        </div>
      </article>
    </li>
  );
}

export function CoachLeaders({ coaches }: { coaches: LandingCoach[] }) {
  return (
    <Rail label="Daftar coach">
      {coaches.map((c) => (
        <CoachCard key={c.id} c={c} />
      ))}
    </Rail>
  );
}
