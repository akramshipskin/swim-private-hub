"use client";

import { useState } from "react";

export type AudienceSteps = { key: string; label: string; steps: { title: string; body: string }[] };

// Tab "Cara kerja" per audiens (orang tua / coach / pemilik kolam).
export function AudienceTabs({ audiences }: { audiences: AudienceSteps[] }) {
  const [active, setActive] = useState(audiences[0].key);
  const current = audiences.find((a) => a.key === active)!;
  return (
    <div>
      <div role="tablist" aria-label="Cara kerja untuk" className="mb-10 flex flex-wrap gap-2">
        {audiences.map((a) => (
          <button
            key={a.key}
            role="tab"
            type="button"
            aria-selected={a.key === active}
            onClick={() => setActive(a.key)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors max-sm:min-h-[44px] ${
              a.key === active ? "bg-fixed-ink text-white" : "border border-fixed-ink/15 bg-white text-fixed-ink hover:bg-fixed-sand"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <ol role="tabpanel" className="grid gap-0 lg:grid-cols-4 lg:gap-8">
        {current.steps.map((s, i) => (
          <li key={s.title} className="relative pb-9 pl-14 last:pb-0 lg:pb-0 lg:pl-0 lg:pt-14">
            <span className="absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-fixed-lime-500 text-sm font-bold text-fixed-ink">
              {i + 1}
            </span>
            {i < current.steps.length - 1 && (
              <span aria-hidden="true" className="absolute left-5 top-10 bottom-0 w-px bg-fixed-ink/20 lg:left-12 lg:right-[-2rem] lg:top-5 lg:bottom-auto lg:h-px lg:w-auto" />
            )}
            <h3 className="text-lg font-semibold leading-snug text-fixed-ink">{s.title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-fixed-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export type FaqGroup = { key: string; label: string; items: { q: string; a: string }[] };

// FAQ per peran: tab yang sama polanya dengan "Cara kerja" supaya landing
// terasa satu bahasa.
export function FaqTabs({ groups }: { groups: FaqGroup[] }) {
  const [active, setActive] = useState(groups[0].key);
  const current = groups.find((g) => g.key === active)!;
  return (
    <div>
      <div role="tablist" aria-label="Pertanyaan umum untuk" className="mb-6 flex flex-wrap gap-2">
        {groups.map((g) => (
          <button
            key={g.key}
            role="tab"
            type="button"
            aria-selected={g.key === active}
            onClick={() => setActive(g.key)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors max-sm:min-h-[44px] ${
              g.key === active
                ? "bg-fixed-ink text-white"
                : "border border-fixed-ink/15 bg-white text-fixed-ink hover:bg-fixed-sand"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex flex-col divide-y divide-fixed-ink/10 border-y border-fixed-ink/10">
        {current.items.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold marker:content-none max-sm:min-h-[44px]">
              {item.q}
              <span aria-hidden="true" className="text-2xl leading-none transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-base text-fixed-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
