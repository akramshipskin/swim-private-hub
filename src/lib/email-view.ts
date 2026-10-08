// Bantu tampilan menu Email admin (gaya Gmail): nama pengirim, inisial,
// waktu singkat, dan pembungkus isi email HTML supaya aman ditampilkan.

export function parseSender(raw: string): { name: string; email: string } {
  const match = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  const email = (match ? match[2] : raw).trim();
  const name = (match?.[1] ?? "").trim() || email.split("@")[0];
  return { name, email };
}

export function senderInitial(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

const WIB = "Asia/Jakarta";

// Gaya Gmail: hari ini = jam saja, hari lain = tanggal + bulan.
export function shortTime(d: Date, now: Date = new Date()): string {
  const day = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: WIB });
  return day(d) === day(now)
    ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: WIB })
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: WIB });
}

// Lapis kedua. Pagar utamanya adalah atribut sandbox di iframe (skrip dan
// form mati); ini membuang yang tidak perlu ada di isi email.
export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<\s*(script|iframe|object|embed|form|noscript)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*\/?\s*(script|iframe|object|embed|form|meta|base|link|noscript)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href\s*=\s*["']?)\s*javascript:[^"'>\s]*/gi, "$1#");
}

const EMAIL_CSP = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:";

export function emailSrcDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${EMAIL_CSP}"><base target="_blank"><style>body{margin:0;padding:4px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#202124;background:#fff;overflow-wrap:anywhere}img{max-width:100%;height:auto}a{color:#1a73e8}table{max-width:100%}</style></head><body>${sanitizeEmailHtml(html)}</body></html>`;
}
