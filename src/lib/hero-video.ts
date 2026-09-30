// Kapan video latar hero boleh diputar. Aturan dari Hadi (1 Okt 2026): hanya
// desktop; berhenti bila "kurangi gerakan" atau hemat data menyala. Jaringan
// lambat (2G/3G) ikut dilewati supaya HP dan koneksi kecil tidak terbebani.
export type VideoEnv = {
  wide: boolean;
  canHover: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  slowNetwork: boolean;
};

export function shouldPlayHeroVideo(e: VideoEnv): boolean {
  return e.wide && e.canHover && !e.reducedMotion && !e.saveData && !e.slowNetwork;
}

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

export function readVideoEnv(win: Window): VideoEnv {
  const connection = (win.navigator as Navigator & { connection?: NetworkInfo }).connection;
  return {
    wide: win.matchMedia("(min-width: 1024px)").matches,
    canHover: win.matchMedia("(hover: hover)").matches,
    reducedMotion: win.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: connection?.saveData === true,
    slowNetwork: ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? ""),
  };
}
