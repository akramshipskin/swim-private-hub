import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEME_VARS } from "./theme-scope";

// Contoh terang/gelap di /brandguideline memakai salinan token. Tes ini gagal
// bila token di globals.css berubah tanpa salinannya ikut diubah.
function block(css: string, selector: string) {
  const start = css.indexOf(selector);
  const open = css.indexOf("{", start);
  return css.slice(open + 1, css.indexOf("}", open));
}
function vars(body: string) {
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2].toLowerCase()]));
}

describe("salinan token di ThemeScope", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  it.each([
    ["light", vars(block(css, ":root {"))],
    ["dark", vars(block(css, ':root[data-theme="dark"] {'))],
  ] as const)("tema %s sama dengan globals.css", (theme, real) => {
    for (const [name, value] of Object.entries(THEME_VARS[theme])) {
      if (!name.startsWith("--")) continue;
      expect([name, real[name]]).toEqual([name, String(value).toLowerCase()]);
    }
  });
});
