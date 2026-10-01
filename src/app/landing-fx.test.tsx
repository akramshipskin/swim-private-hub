import { afterEach, describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { HeroFx, Magnetic } from "./landing-fx";

function media(match: Record<string, boolean>) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: match[q] ?? false, addEventListener() {}, removeEventListener() {} }));
}
const DESKTOP = { "(hover: hover) and (pointer: fine)": true, "(prefers-reduced-motion: reduce)": false };

function heroWithFx() {
  const { container } = render(
    <section>
      <HeroFx />
    </section>,
  );
  const section = container.querySelector("section")!;
  const layer = section.firstElementChild as HTMLElement;
  return { section, layer };
}
const down = (el: Element) => el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10 }));

afterEach(() => vi.unstubAllGlobals());

describe("HeroFx", () => {
  it("diketuk: membuat satu riak besar di lapisan", () => {
    media(DESKTOP);
    const { section, layer } = heroWithFx();
    down(section);
    expect(layer.querySelectorAll(".hero-ripple.is-tap")).toHaveLength(1);
  });

  it("riak dibatasi maksimal 6 di layar (yang lama dibuang)", () => {
    media(DESKTOP);
    const { section, layer } = heroWithFx();
    for (let i = 0; i < 10; i++) down(section);
    expect(layer.childElementCount).toBe(6);
  });

  it("kurangi gerakan: tidak ada riak sama sekali", () => {
    media({ ...DESKTOP, "(prefers-reduced-motion: reduce)": true });
    const { section, layer } = heroWithFx();
    down(section);
    expect(layer.childElementCount).toBe(0);
  });
});

describe("Magnetic", () => {
  it("desktop: tombol bergeser ke arah kursor, maksimal 10px, kembali saat kursor keluar", () => {
    media(DESKTOP);
    const { container } = render(<Magnetic><a href="/x">Daftar</a></Magnetic>);
    const el = container.firstElementChild as HTMLElement;
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40, right: 100, bottom: 40, x: 0, y: 0, toJSON() {} });
    el.dispatchEvent(new MouseEvent("pointermove", { clientX: 500, clientY: 20 }));
    expect(el.style.transform).toBe("translate(10px, 0px)");
    el.dispatchEvent(new MouseEvent("pointerleave"));
    expect(el.style.transform).toBe("");
  });

  it("HP (tanpa kursor halus): tidak bergerak", () => {
    media({ "(hover: hover) and (pointer: fine)": false });
    const { container } = render(<Magnetic><a href="/x">Daftar</a></Magnetic>);
    const el = container.firstElementChild as HTMLElement;
    el.dispatchEvent(new MouseEvent("pointermove", { clientX: 500, clientY: 20 }));
    expect(el.style.transform).toBe("");
  });
});
