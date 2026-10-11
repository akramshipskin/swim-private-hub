// Kerangka email bermerek SPH (Hadi 11 Okt: email jangan teks polos saja).
// Tabel + gaya sebaris supaya tampil sama di Gmail, Outlook, dan aplikasi HP;
// warna dari brand guideline (charcoal #14140f, lime #9fcc1f, latar #f6f6ee).
// Teks polos tetap dikirim berdampingan untuk aplikasi yang tidak menampilkan HTML.

const SITE = "https://www.swimprivatehub.biz.id";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type BrandEmail = {
  preheader: string;
  title: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  note?: string;
};

export function renderBrandEmail({ preheader, title, paragraphs, button, note }: BrandEmail): { html: string; text: string } {
  const font = "font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;${font};font-size:15px;line-height:1.6;color:#3d3b30">${esc(p)}</p>`).join("");
  const cta = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr><td style="border-radius:12px;background:#14140f"><a href="${esc(button.url)}" style="display:inline-block;padding:13px 24px;${font};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${esc(button.label)}</a></td></tr></table>
<p style="margin:0 0 14px;${font};font-size:12px;line-height:1.5;color:#6c6957">Tombol tidak bisa ditekan? Salin alamat ini ke browser:<br><a href="${esc(button.url)}" style="color:#14140f;word-break:break-all">${esc(button.url)}</a></p>`
    : "";
  const noteHtml = note ? `<p style="margin:14px 0 0;padding-top:14px;border-top:1px solid #dedaca;${font};font-size:13px;line-height:1.5;color:#6c6957">${esc(note)}</p>` : "";
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f6f6ee">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6ee"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
<tr><td style="padding:0 4px 18px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td><img src="${SITE}/logo.png" width="36" height="36" alt="" style="display:block;border-radius:10px"></td>
<td style="padding-left:10px;font-family:'Sora',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;font-weight:600;color:#14140f">swim<span style="color:#9fcc1f">.</span>privatehub</td>
</tr></table></td></tr>
<tr><td style="background:#ffffff;border:1px solid #dedaca;border-radius:16px;padding:28px 24px">
<div style="height:4px;width:40px;background:#9fcc1f;border-radius:4px;margin:0 0 18px"></div>
<h1 style="margin:0 0 14px;font-family:'Sora',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:21px;line-height:1.3;font-weight:600;color:#14140f">${esc(title)}</h1>
${body}${cta}${noteHtml}
</td></tr>
<tr><td style="padding:18px 4px 0;${font};font-size:12px;line-height:1.5;color:#6c6957">Swim Private Hub · les renang privat dengan coach pilihan<br><a href="${SITE}" style="color:#6c6957">${SITE.replace("https://", "")}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [title, "", ...paragraphs.flatMap((p) => [p, ""]), ...(button ? [`${button.label}: ${button.url}`, ""] : []), ...(note ? [note, ""] : []), "Swim Private Hub"].join("\n");
  return { html, text };
}
