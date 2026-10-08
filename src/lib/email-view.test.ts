import { describe, expect, it } from "vitest";
import { emailSrcDoc, parseSender, sanitizeEmailHtml, senderInitial, shortTime } from "./email-view";

describe("parseSender", () => {
  it("memisah nama dan alamat", () => {
    expect(parseSender('Anthropic <no-reply@anthropic.com>')).toEqual({ name: "Anthropic", email: "no-reply@anthropic.com" });
    expect(parseSender('"Budi S" <budi@x.id>')).toEqual({ name: "Budi S", email: "budi@x.id" });
  });
  it("alamat polos dipakai sebagai nama dari bagian depannya", () => {
    expect(parseSender("budi@x.id")).toEqual({ name: "budi", email: "budi@x.id" });
  });
  it("nama kosong jatuh ke bagian depan alamat", () => {
    expect(parseSender("<budi@x.id>")).toEqual({ name: "budi", email: "budi@x.id" });
  });
});

describe("senderInitial", () => {
  it("huruf besar pertama, tanda tanya bila kosong", () => {
    expect(senderInitial("budi")).toBe("B");
    expect(senderInitial("  ")).toBe("?");
  });
});

describe("shortTime", () => {
  const now = new Date("2026-10-08T05:00:00Z"); // 12.00 WIB
  it("hari ini = jam saja", () => {
    expect(shortTime(new Date("2026-10-08T02:05:00Z"), now)).toMatch(/09[.:]05/);
  });
  it("hari lain = tanggal dan bulan", () => {
    expect(shortTime(new Date("2026-10-06T02:05:00Z"), now)).toMatch(/6/);
    expect(shortTime(new Date("2026-10-06T02:05:00Z"), now)).not.toMatch(/[.:]/);
  });
});

describe("sanitizeEmailHtml", () => {
  it("membuang skrip, form, iframe, meta refresh, dan base", () => {
    const out = sanitizeEmailHtml(
      '<p>Halo</p><script>alert(1)</script><iframe src="https://x"></iframe><form action="/x"><input></form><meta http-equiv="refresh" content="0;url=https://evil"><base href="https://evil">',
    );
    expect(out).toBe("<p>Halo</p>");
  });
  it("membuang atribut on* dan href javascript:", () => {
    const out = sanitizeEmailHtml('<a href="javascript:alert(1)" onclick="x()">Klik</a><img src="https://a/b.png" onerror=bad()>');
    expect(out).not.toMatch(/onclick|onerror|javascript:/i);
    expect(out).toContain('<a href="#"');
  });
  it("tombol dan gambar biasa tetap ada", () => {
    const html = '<a href="https://x.id/verify" style="background:#000;color:#fff">Verifikasi</a><img src="https://x.id/logo.png">';
    expect(sanitizeEmailHtml(html)).toBe(html);
  });
});

describe("emailSrcDoc", () => {
  it("memasang CSP ketat dan tautan buka di tab baru", () => {
    const doc = emailSrcDoc("<p>Isi</p>");
    expect(doc).toContain("default-src 'none'");
    expect(doc).toContain('<base target="_blank">');
    expect(doc).toContain("<p>Isi</p>");
  });
  it("CSP kita tidak tergeser oleh meta dari email", () => {
    const doc = emailSrcDoc('<meta http-equiv="Content-Security-Policy" content="default-src *">');
    expect(doc.match(/Content-Security-Policy/g)).toHaveLength(1);
  });
});
