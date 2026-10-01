"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Efek interaktif landing. Semua efek mati bila pengguna memilih "kurangi
// gerakan". Efek yang butuh kursor (miring, sorotan, magnetis, riak saat
// kursor bergerak) hanya di perangkat dengan kursor halus (desktop); di HP
// yang tersisa hanya riak saat layar diketuk. Elemen dibuat/diubah langsung
// lewat DOM (bukan state React) supaya tidak memicu render ulang.

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const MAX_RIPPLES = 6;
const MOVE_GAP_MS = 110;
const MOVE_GAP_PX = 48;

// Lapisan riak air di hero + kemiringan layar HP ([data-tilt]) mengikuti kursor.
export function HeroFx() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const section = layer?.parentElement;
    if (!layer || !section || reduceMotion()) return;
    const tilt = section.querySelector<HTMLElement>("[data-tilt]");
    const fine = finePointer();
    let last = { t: 0, x: -999, y: -999 };
    let raf = 0;

    const ripple = (x: number, y: number, tap: boolean) => {
      if (layer.childElementCount >= MAX_RIPPLES) layer.firstElementChild?.remove();
      const r = document.createElement("span");
      r.className = tap ? "hero-ripple is-tap" : "hero-ripple";
      r.style.left = `${x}px`;
      r.style.top = `${y}px`;
      r.addEventListener("animationend", () => r.remove(), { once: true });
      layer.appendChild(r);
    };

    const local = (e: PointerEvent) => {
      const b = section.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top, w: b.width, h: b.height };
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const p = local(e);
      const now = performance.now();
      if (now - last.t > MOVE_GAP_MS && Math.hypot(p.x - last.x, p.y - last.y) > MOVE_GAP_PX) {
        ripple(p.x, p.y, false);
        last = { t: now, x: p.x, y: p.y };
      }
      if (tilt) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          tilt.style.setProperty("--ry", `${((p.x / p.w - 0.5) * 14).toFixed(2)}deg`);
          tilt.style.setProperty("--rx", `${((0.5 - p.y / p.h) * 10).toFixed(2)}deg`);
        });
      }
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      ripple(p.x, p.y, true);
    };
    const onLeave = () => {
      tilt?.style.setProperty("--rx", "0deg");
      tilt?.style.setProperty("--ry", "0deg");
    };

    if (fine) {
      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave);
    }
    section.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden" />;
}

// Sorotan kursor: tiap anak [data-spot] mendapat --mx/--my relatif terhadap dirinya.
export function Spotlight({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion() || !finePointer()) return;
    const cells = () => el.querySelectorAll<HTMLElement>("[data-spot]");
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        cells().forEach((c) => {
          const b = c.getBoundingClientRect();
          c.style.setProperty("--mx", `${e.clientX - b.left}px`);
          c.style.setProperty("--my", `${e.clientY - b.top}px`);
        });
      });
    };
    const on = () => el.classList.add("spot-on");
    const off = () => el.classList.remove("spot-on");
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerenter", on);
    el.addEventListener("pointerleave", off);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", on);
      el.removeEventListener("pointerleave", off);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Tombol "tertarik" ke kursor saat didekati (desktop). Geser maksimal ±10px.
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion() || !finePointer()) return;
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const dx = Math.max(-10, Math.min(10, (e.clientX - (b.left + b.width / 2)) * 0.3));
      const dy = Math.max(-10, Math.min(10, (e.clientY - (b.top + b.height / 2)) * 0.3));
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <span ref={ref} className="inline-flex shrink-0 transition-transform duration-300 ease-out">
      {children}
    </span>
  );
}
