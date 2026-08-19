"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 70;
const MAX_PULL = 100;

// Gesture tarik-turun ala app native, meski ini web biasa. router.refresh()
// nge-refetch data Server Component buat route ini tapi TETEP nunjukin UI
// lama (dari cache/transition React) sampe data baru dateng -- gak ada
// flash blank kayak reload penuh, jadi berasa "cached refresh" bukan
// reload keras.
//
// Cuma aktif lewat event touch (jari), jadi otomatis no-op di desktop
// (mouse gak trigger touch event) -- gak perlu deteksi viewport manual.
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullingRef = useRef(false);
  const startYRef = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    if (window.scrollY <= 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(delta * 0.5, MAX_PULL));
    } else {
      pullingRef.current = false;
      setPullDistance(0);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(() => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullDistance > THRESHOLD) {
      setRefreshing(true);
      router.refresh();
      // Kasih jeda kecil biar spinner keliatan gerak (refresh Next.js
      // biasanya cepet banget, tanpa jeda spinner cuma "kedip").
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
      }, 500);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, router]);

  const indicatorHeight = refreshing ? 44 : pullDistance;
  const showIndicator = indicatorHeight > 4;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden sm:hidden"
        style={{
          height: indicatorHeight,
          transition: pullingRef.current ? "none" : "height 0.2s ease-out",
        }}
      >
        {showIndicator && (
          <div
            className={`h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent ${
              refreshing ? "animate-spin" : ""
            }`}
            style={!refreshing ? { transform: `rotate(${pullDistance * 3.2}deg)` } : undefined}
          />
        )}
      </div>
      {children}
    </div>
  );
}
