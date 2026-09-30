import { describe, it, expect } from "vitest";
import { readVideoEnv, shouldPlayHeroVideo, type VideoEnv } from "./hero-video";

const ok: VideoEnv = { wide: true, canHover: true, reducedMotion: false, saveData: false, slowNetwork: false };

describe("shouldPlayHeroVideo", () => {
  it("putar hanya bila desktop, bisa hover, gerak tidak dikurangi, bukan hemat data, jaringan tidak lambat", () => {
    expect(shouldPlayHeroVideo(ok)).toBe(true);
  });

  it.each([
    ["layar sempit (HP/tablet)", { wide: false }],
    ["perangkat sentuh tanpa hover", { canHover: false }],
    ["kurangi gerakan menyala", { reducedMotion: true }],
    ["hemat data menyala", { saveData: true }],
    ["jaringan lambat", { slowNetwork: true }],
  ] as [string, Partial<VideoEnv>][])("tidak putar: %s", (_nama, override) => {
    expect(shouldPlayHeroVideo({ ...ok, ...override })).toBe(false);
  });
});

function fakeWindow(matches: Record<string, boolean>, connection?: { saveData?: boolean; effectiveType?: string }) {
  return {
    matchMedia: (q: string) => ({ matches: matches[q] ?? false }),
    navigator: { connection },
  } as unknown as Window;
}

describe("readVideoEnv", () => {
  it("membaca media query dan info jaringan", () => {
    const env = readVideoEnv(
      fakeWindow(
        { "(min-width: 1024px)": true, "(hover: hover)": true, "(prefers-reduced-motion: reduce)": false },
        { saveData: false, effectiveType: "4g" },
      ),
    );
    expect(env).toEqual(ok);
  });

  it("hemat data dan jaringan 3G terbaca; tanpa info jaringan dianggap normal", () => {
    expect(readVideoEnv(fakeWindow({}, { saveData: true })).saveData).toBe(true);
    expect(readVideoEnv(fakeWindow({}, { effectiveType: "3g" })).slowNetwork).toBe(true);
    expect(readVideoEnv(fakeWindow({}, undefined))).toMatchObject({ saveData: false, slowNetwork: false });
  });
});
