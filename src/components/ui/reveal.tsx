"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Scroll-reveal wrapper -- zero-dependency (IntersectionObserver + CSS
// transition, no animation library). `eager` skips the observer and plays
// on mount instead, for above-the-fold content that's visible immediately
// (double rAF so the initial "hidden" state actually paints before the
// transition kicks in, otherwise it just snaps straight to visible).
export function Reveal({
  children,
  className,
  delay = 0,
  eager = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Lazy initializer (not an effect) so the reduced-motion case never needs
  // a setState call inside the effect body itself.
  const [visible, setVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) return;

    if (eager) {
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf1);
    }

    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className ?? ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
