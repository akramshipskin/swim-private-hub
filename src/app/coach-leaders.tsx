"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import type { LandingCoach } from "./landing-view";

// Gaya referensi Stride ("meet the leaders"): kartu polaroid agak miring,
// nyebar kiri-kanan-tengah, muncul satu per satu saat scroll vertikal.
// Saat hover/tap/fokus: kartu jadi lurus dan MELEBAR jadi satu kartu horizontal
// (satu box, bukan dua kotak ditempel). Info wajah melipat ke panel, lepas
// hover balik lagi. Di HP panel kebuka ke bawah kartu.
//
// Anti-flicker: buka-tutup dikontrol state JS (hover intent) via data-open,
// CSS-nya di globals.css (.coach-card). Alasannya: pas hover tinggi kartu
// nyusut (info melipat) dan kartu muter lurus -- kursor yang diam bisa
// tiba-tiba berada di luar kartu sehingga :hover murni lepas-sambung
// berulang (kedip). Dengan JS, nutupnya dikasih jeda 250ms: kalau kursor
// balik dalam 250ms, penutupan dibatalkan.
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Info wajah kartu: dipakai dua tempat (wajah + panel) dengan isi yang sama
// persis -- yang di wajah melipat pas kebuka, yang di panel tampil pas kebuka.
function CoachHeading({ c }: { c: LandingCoach }) {
  return (
    <>
      {c.specialties[0] && (
        <p className="text-sm font-semibold text-fixed-muted">{c.specialties[0]}</p>
      )}
      <h3 className="mt-0.5 text-2xl font-semibold leading-tight text-fixed-ink">{c.name}</h3>
      {c.bioLine && <p className="mt-0.5 text-sm text-fixed-muted">{c.bioLine}</p>}
      {c.certifiedLabel && (
        <p className="mt-2">
          <span className="fx-coach-badge box-decoration-clone rounded-full bg-fixed-lime-100 px-3 py-1 text-xs font-semibold leading-[1.9] text-fixed-ink">
            {c.certifiedLabel}
          </span>
        </p>
      )}
    </>
  );
}

const SPOTS = [
  "self-start sm:ml-10 rotate-[-2deg]",
  "self-end sm:mr-10 rotate-[2deg]",
  "self-center rotate-[-1deg]",
];

// Arah masuk tiap kartu (desktop): kiri, kanan, tengah (naik dari bawah),
// sesuai posisinya di SPOTS. Dipakai CSS lewat --dir.
const ENTER_DIR = [-1, 1, 0];

// Jalur tali lintasan di belakang kartu (desktop): kurva S yang melewati
// pusat tiap kartu (kiri ~18%, kanan ~82%, tengah 50% dari lebar daftar) dan
// berkelok di antaranya. Sumbu y dalam rem: tiap kartu 36rem + jarak 5rem.
const SPOT_X = [18, 82, 50];
const CARD_REM = 36;
const GAP_REM = 5;
export function lanePath(n: number) {
  const height = n * CARD_REM + (n - 1) * GAP_REM;
  const pts: [number, number][] = [[50, 0]];
  for (let i = 0; i < n; i++) pts.push([SPOT_X[i % SPOT_X.length], i * (CARD_REM + GAP_REM) + CARD_REM / 2]);
  pts.push([50, height]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [xa, ya] = pts[i - 1];
    const [xb, yb] = pts[i];
    const mid = (ya + yb) / 2;
    d += ` C ${xa} ${mid}, ${xb} ${mid}, ${xb} ${yb}`;
  }
  return { d, height };
}

const CLOSE_GRACE_MS = 250;

function CoachCard({ c, index }: { c: LandingCoach; index: number }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
  };
  useEffect(() => () => clearAllTimers(), []);

  const handleEnter = () => {
    clearAllTimers();
    setOpen(true);
  };
  const doClose = () => {
    setOpen(false);
  };
  // Nutupnya dikasih jeda: kursor yang cuma lewat sekilas di tepi kartu
  // tidak memicu buka-tutup berulang.
  const handleLeave = () => {
    clearAllTimers();
    closeTimer.current = setTimeout(doClose, CLOSE_GRACE_MS);
  };
  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      clearAllTimers();
      doClose();
    }
  };

  return (
    <li
      style={{ minHeight: "36rem", "--dir": ENTER_DIR[index % ENTER_DIR.length], "--i": index % 5 } as React.CSSProperties}
      data-open={open}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleBlur}
      className={`coach-card fx-coach relative w-72 before:absolute before:-inset-3 before:content-[""] sm:w-80 ${SPOTS[index % SPOTS.length]}`}
    >
      <Reveal delay={(index % 3) * 90}>
        <article
          className="fx-coach-art relative rounded-3xl bg-white p-3 shadow-[0_8px_30px_rgba(20,20,15,0.08)]"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Wajah kartu: max-w diset pas 296px (18.5rem) supaya di state
                diam kanan-kiri-atas simetris; pas kebuka kekunci di angka
                yang sama dan panel yang ngisi sisanya. */}
            <div className="w-full max-w-[18.5rem] shrink-0">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-fixed-lime-100">
                {c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photoUrl} alt={`Foto ${c.name}`} className="fx-coach-photo h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-7xl font-semibold tracking-tight text-fixed-ink/60">{initials(c.name)}</span>
                  </div>
                )}
              </div>
              <div className="coach-face">
                <div className="px-2 pb-2 pt-4">
                  <CoachHeading c={c} />
                  <Link href={`/pelatih/${c.id}`} className="mt-2 inline-block text-sm font-semibold text-fixed-ink underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
                    Lihat profil lengkap
                  </Link>
                </div>
              </div>
            </div>
            {/* Panel info: di HP di bawah wajah, di desktop jadi kolom
                kanan dalam box yang sama. */}
            <div className="coach-panel">
              <div className="fx-coach-pane sm:max-h-[22.5rem] sm:w-[22rem] sm:shrink-0 sm:overflow-y-auto sm:pl-6 sm:pr-3 sm:pt-2">
                <CoachHeading c={c} />
                {c.bio && <p className="mt-3 text-base leading-relaxed text-fixed-ink-soft">{c.bio}</p>}
                {c.specialties.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {c.specialties.map((s) => (
                      <li key={s} className="rounded-full bg-fixed-lime-100 px-3 py-1 text-sm text-fixed-ink">{s}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-sm text-fixed-muted">
                  Mengajar di: <span className="font-semibold text-fixed-ink">{c.pools.join(", ") || "-"}</span>
                </p>
                <Link href={`/pelatih/${c.id}`} className="fx-coach-link mt-2 inline-block text-sm font-semibold text-fixed-ink underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
                  Lihat profil lengkap
                </Link>
              </div>
            </div>
          </div>
        </article>
      </Reveal>
    </li>
  );
}

export function CoachLeaders({ coaches }: { coaches: LandingCoach[] }) {
  const lane = lanePath(coaches.length);
  const laneSvg = (cls: string) => (
    <svg aria-hidden="true" viewBox={`0 0 100 ${lane.height}`} preserveAspectRatio="none" className={`${cls} pointer-events-none absolute inset-0 hidden h-full w-full lg:block`}>
      <path d={lane.d} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
  return (
    <div className="relative">
      {/* Tali lintasan: garis putus-putus tetap, garis lime penuh tergambar mengikuti scroll (desktop). */}
      {laneSvg("fx-coach-lane")}
      {laneSvg("fx-coach-lane-draw")}
      <ul className="relative flex flex-col items-center gap-14 sm:gap-20">
        {coaches.map((c, i) => (
          <CoachCard key={c.id} c={c} index={i} />
        ))}
      </ul>
    </div>
  );
}
