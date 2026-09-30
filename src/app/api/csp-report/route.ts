// Penerima laporan pelanggaran CSP (mode pantau, lihat next.config.ts). Publik
// tanpa login karena browser yang mengirim. Hanya mencatat ringkasan ke log
// server (Vercel Logs) -- tidak menyimpan apa pun ke database.
const MAX_BODY = 8 * 1024;
// ponytail: penghitung per instance server (bukan global) -- cukup untuk
// membatasi banjir log; kalau perlu ketat, pindahkan ke takeAttempt (DB).
const MAX_LOGS_PER_MINUTE = 30;
let windowStart = 0;
let logged = 0;

export function summarizeCspReport(raw: unknown): string | null {
  // Dua bentuk: {"csp-report": {...}} (report-uri) atau [{type:"csp-violation", body:{...}}] (Reporting API).
  const first = Array.isArray(raw) ? (raw[0] as { body?: unknown } | undefined)?.body : (raw as { "csp-report"?: unknown } | null)?.["csp-report"];
  if (!first || typeof first !== "object") return null;
  const r = first as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) if (typeof r[k] === "string") return (r[k] as string).slice(0, 200);
    return "?";
  };
  return `directive=${pick("violated-directive", "effectiveDirective")} blocked=${pick("blocked-uri", "blockedURL")} page=${pick("document-uri", "documentURL")}`;
}

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length <= MAX_BODY) {
    let summary: string | null = null;
    try {
      summary = summarizeCspReport(JSON.parse(text));
    } catch {
      summary = null;
    }
    const now = Date.now();
    if (now - windowStart > 60_000) {
      windowStart = now;
      logged = 0;
    }
    if (summary && logged < MAX_LOGS_PER_MINUTE) {
      logged++;
      console.warn(`[csp] ${summary}`);
    }
  }
  return new Response(null, { status: 204 });
}
