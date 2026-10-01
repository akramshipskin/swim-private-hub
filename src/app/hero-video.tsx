"use client";

import { useEffect, useRef, useState } from "react";
import { readVideoEnv, shouldPlayHeroVideo } from "@/lib/hero-video";

// Video latar hero, desktop saja. Tidak ada tag <video> sama sekali di HP,
// hemat data, atau "kurangi gerakan" (jadi file video tidak ikut terunduh).
// Mulai setelah halaman selesai dimuat supaya tidak berebut dengan gambar
// pembuka; foto pembuka tetap jadi latar sampai video siap, lalu memudar ke
// video. Berhenti saat hero keluar layar.
const START_DELAY_MS = 800;

export function HeroVideo({ mp4, webm, poster }: { mp4: string; webm: string; poster: string }) {
  const [play, setPlay] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const queries = ["(min-width: 1024px)", "(hover: hover)", "(prefers-reduced-motion: reduce)"].map((q) => window.matchMedia(q));
    const evaluate = () => setPlay(shouldPlayHeroVideo(readVideoEnv(window)));
    // Baru dinilai SETELAH halaman selesai dimuat (+ jeda), supaya unduhan video
    // tidak berebut jaringan dengan gambar pembuka (elemen terbesar).
    let first = 0;
    const onLoad = () => {
      first = window.setTimeout(evaluate, START_DELAY_MS);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    queries.forEach((q) => q.addEventListener("change", evaluate));
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("load", onLoad);
      queries.forEach((q) => q.removeEventListener("change", evaluate));
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!play || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [play]);

  if (!play) return null;
  return (
    <video
      ref={ref}
      aria-hidden="true"
      muted
      loop
      playsInline
      autoPlay
      disablePictureInPicture
      preload="auto"
      poster={poster}
      onCanPlay={() => setReady(true)}
      className={`absolute inset-0 -z-[15] h-full w-full object-cover object-[72%_20%] transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
    >
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
