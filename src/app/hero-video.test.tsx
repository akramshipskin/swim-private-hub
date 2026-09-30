import { afterEach, describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HeroVideo } from "./hero-video";

function stubBrowser(matches: Record<string, boolean>, connection?: { saveData?: boolean; effectiveType?: string }) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: matches[q] ?? false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  Object.defineProperty(navigator, "connection", { value: connection, configurable: true });
}

const DESKTOP = { "(min-width: 1024px)": true, "(hover: hover)": true, "(prefers-reduced-motion: reduce)": false };
const props = { mp4: "/v/hero.mp4", webm: "/v/hero.webm", poster: "/p.jpg" };
const tick = () => new Promise((r) => setTimeout(r, 30));

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(navigator, "connection", { value: undefined, configurable: true });
});

describe("HeroVideo", () => {
  it("desktop normal: tag video muncul dengan sumber webm lalu mp4, tanpa suara, berulang", async () => {
    stubBrowser(DESKTOP);
    const { container } = render(<HeroVideo {...props} />);
    await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
    const v = container.querySelector("video")!;
    expect(v.muted).toBe(true);
    expect(v.loop).toBe(true);
    expect([...v.querySelectorAll("source")].map((s) => s.getAttribute("src"))).toEqual(["/v/hero.webm", "/v/hero.mp4"]);
  });

  it("kurangi gerakan menyala: tidak ada tag video (file tidak ikut terunduh)", async () => {
    stubBrowser({ ...DESKTOP, "(prefers-reduced-motion: reduce)": true });
    const { container } = render(<HeroVideo {...props} />);
    await tick();
    expect(container.querySelector("video")).toBeNull();
  });

  it("hemat data menyala: tidak ada tag video", async () => {
    stubBrowser(DESKTOP, { saveData: true });
    const { container } = render(<HeroVideo {...props} />);
    await tick();
    expect(container.querySelector("video")).toBeNull();
  });

  it("layar HP: tidak ada tag video", async () => {
    stubBrowser({ ...DESKTOP, "(min-width: 1024px)": false, "(hover: hover)": false });
    const { container } = render(<HeroVideo {...props} />);
    await tick();
    expect(container.querySelector("video")).toBeNull();
  });
});
