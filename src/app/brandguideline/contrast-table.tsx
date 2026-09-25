import { contrastRatio, wcagLevel, WCAG_LEVEL_LABEL } from "@/lib/contrast";
import { Badge } from "@/components/ui/badge";

export type ContrastPair = { label: string; fg: string; bg: string };

// Rasio & tingkat dihitung di sini lewat src/lib/contrast.ts (tes:
// src/lib/contrast.test.ts) -- bukan angka yang diketik manual, supaya kalau
// hex di bawah salah ketik atau tokennya berubah, tabel ini otomatis ikut
// berubah juga.
function levelTone(level: ReturnType<typeof wcagLevel>): "success" | "warning" | "danger" {
  if (level === "AAA" || level === "AA") return "success";
  if (level === "AA-large") return "warning";
  return "danger";
}

function Swatch({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i aria-hidden className="inline-block h-3.5 w-3.5 rounded-full border border-border/60" style={{ background: hex }} />
      <span className="font-mono text-[11px] uppercase text-text-subtle">{hex}</span>
    </span>
  );
}

export function ContrastTable({ pairs }: { pairs: ContrastPair[] }) {
  const rows = pairs.map((pair) => {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const level = wcagLevel(ratio);
    return { ...pair, ratio, level };
  });

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-text-subtle">
              <th className="py-1.5 font-medium">Pasangan</th>
              <th className="py-1.5 font-medium">Warna</th>
              <th className="py-1.5 text-right font-medium">Rasio</th>
              <th className="py-1.5 text-right font-medium">Tingkat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <td className="py-2 pr-3 text-text">{row.label}</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Swatch hex={row.fg} /> <span className="text-text-subtle">di</span> <Swatch hex={row.bg} />
                  </span>
                </td>
                <td className="py-2 pl-3 text-right font-mono text-xs text-text">{row.ratio.toFixed(2)}:1</td>
                <td className="py-2 pl-3 text-right">
                  <Badge tone={levelTone(row.level)}>{WCAG_LEVEL_LABEL[row.level]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 sm:hidden">
        {rows.map((row) => (
          <li key={row.label} className="rounded-xl border border-border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-text">{row.label}</span>
              <Badge tone={levelTone(row.level)}>{WCAG_LEVEL_LABEL[row.level]}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Swatch hex={row.fg} /> <span className="text-text-subtle">di</span> <Swatch hex={row.bg} />
              <span className="ml-auto font-mono text-xs text-text-subtle">{row.ratio.toFixed(2)}:1</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
