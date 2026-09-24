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
        <p className="text-sm font-semibold text-[#5C5945]">{c.specialties[0]}</p>
      )}
      <h3 className="mt-0.5 text-2xl font-semibold leading-tight text-[#14140F]">{c.name}</h3>
      {c.bioLine && <p className="mt-0.5 text-sm text-[#5C5945]">{c.bioLine}</p>}
      {c.certified && (
        <p className="mt-2">
          <span className="box-decoration-clone rounded-full bg-[#E3F5B0] px-3 py-1 text-xs font-semibold leading-[1.9] text-[#14140F]">
            Bersertifikat{c.certificationNote ? ` · ${c.certificationNote}` : ""}
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
      style={{ minHeight: "36rem" }}
      data-open={open}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleBlur}
      className={`coach-card relative w-72 before:absolute before:-inset-3 before:content-[""] sm:w-80 ${SPOTS[index % SPOTS.length]}`}
    >
      <Reveal delay={(index % 3) * 90}>
        <article
          className="relative rounded-3xl bg-white p-3 shadow-[0_8px_30px_rgba(20,20,15,0.08)]"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Wajah kartu: max-w diset pas 296px (18.5rem) supaya di state
                diam kanan-kiri-atas simetris; pas kebuka kekunci di angka
                yang sama dan panel yang ngisi sisanya. */}
            <div className="w-full max-w-[18.5rem] shrink-0">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#E3F5B0]">
                {c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photoUrl} alt={`Foto ${c.name}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-7xl font-semibold tracking-tight text-[#14140F]/60">{initials(c.name)}</span>
                  </div>
                )}
              </div>
              <div className="coach-face">
                <div className="px-2 pb-2 pt-4">
                  <CoachHeading c={c} />
                  <Link href={`/pelatih/${c.id}`} className="mt-2 inline-block text-sm font-semibold text-[#14140F] underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
                    Lihat profil lengkap
                  </Link>
                </div>
              </div>
            </div>
            {/* Panel info: di HP di bawah wajah, di desktop jadi kolom
                kanan dalam box yang sama. */}
            <div className="coach-panel">
              <div className="sm:max-h-[22.5rem] sm:w-[22rem] sm:shrink-0 sm:overflow-y-auto sm:pl-6 sm:pr-3 sm:pt-2">
                <CoachHeading c={c} />
                {c.bio && <p className="mt-3 text-base leading-relaxed text-[#3D3B2E]">{c.bio}</p>}
                {c.specialties.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {c.specialties.map((s) => (
                      <li key={s} className="rounded-full bg-[#E3F5B0] px-3 py-1 text-sm text-[#14140F]">{s}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-sm text-[#5C5945]">
                  Mengajar di: <span className="font-semibold text-[#14140F]">{c.pools.join(", ") || "-"}</span>
                </p>
                <Link href={`/pelatih/${c.id}`} className="mt-2 inline-block text-sm font-semibold text-[#14140F] underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
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
  return (
    <ul className="flex flex-col items-center gap-14 sm:gap-20">
      {coaches.map((c, i) => (
        <CoachCard key={c.id} c={c} index={i} />
      ))}
    </ul>
  );
}
