import { describe, expect, it } from "vitest";
import { renderBrandEmail } from "./email-template";

describe("renderBrandEmail", () => {
  it("isi dari pengguna di-escape, tombol + teks polos memuat tautan yang sama", () => {
    const { html, text } = renderBrandEmail({ preheader: "p", title: "Judul", paragraphs: ["Halo <b>Budi</b> & co"], button: { label: "Buka", url: "https://x.test/a?b=1&c=2" } });
    expect(html).toContain("Halo &lt;b&gt;Budi&lt;/b&gt; &amp; co");
    expect(html).not.toContain("<b>Budi</b>");
    expect(html).toContain('href="https://x.test/a?b=1&amp;c=2"');
    expect(text).toContain("Buka: https://x.test/a?b=1&c=2");
  });
});
