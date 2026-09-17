"use client";

import { useState } from "react";

export type AudienceSteps = { key: string; label: string; steps: { title: string; body: string }[] };

// Tab "Cara kerja" per audiens (orang tua / coach / pemilik kolam).
export function AudienceTabs({ audiences }: { audiences: AudienceSteps[] }) {
  const [active, setActive] = useState(audiences[0].key);
  const current = audiences.find((a) => a.key === active)!;
  return (
    <div>
      <div role="tablist" aria-label="Cara kerja untuk" className="mb-8 flex flex-wrap justify-center gap-2">
        {audiences.map((a) => (
          <button
            key={a.key}
            role="tab"
            type="button"
            aria-selected={a.key === active}
            onClick={() => setActive(a.key)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              a.key === active ? "bg-[#14140F] text-white" : "border border-[#14140F]/15 bg-white text-[#14140F] hover:bg-[#ECE9DC]"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <ol role="tabpanel" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {current.steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-white p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9FCC1F] text-sm font-bold text-[#14140F]">
              {i + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-[#14140F]">{s.title}</h3>
            <p className="mt-2 text-sm text-[#5C5945]">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
