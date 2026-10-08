"use client";

import { useEffect, useRef } from "react";

// Isi email HTML ditampilkan di iframe tanpa skrip dan tanpa form
// (sandbox tanpa allow-scripts), jadi aman walau pengirimnya tidak dikenal.
// allow-same-origin hanya supaya tingginya bisa disesuaikan dengan isi.

// Tinggi diset 0 dulu baru diukur: email yang memakai "tinggi 100%" atau
// "min-height: 100vh" menahan ukuran di tinggi bingkai sebelumnya, sehingga
// isinya terpotong. Dengan bingkai 0, tinggi isi yang asli yang terbaca.
export function fitFrame(el: HTMLIFrameElement) {
  const doc = el.contentDocument;
  if (!doc?.body) return;
  el.style.width = "100%";
  el.style.height = "0px";
  // Email selebar 600 px di HP: bingkai melebar dan dibungkus geser samping,
  // bukan dipotong.
  const wide = doc.documentElement.scrollWidth;
  if (wide > el.clientWidth) el.style.width = `${wide}px`;
  const h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
  // +8: jarak atas-bawah isi yang tidak ikut terhitung saat bingkai setinggi 0.
  el.style.height = `${Math.min(Math.max(h + 8, 60), 8000)}px`;
}

export default function EmailBody({ srcDoc }: { srcDoc: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  // Tidak memakai prop onLoad: bingkai bisa selesai dimuat SEBELUM halaman
  // "hidup" (hydration), lalu event load-nya terlewat dan tinggi tertahan di
  // nilai awal (terjadi di live, tidak di mesin dev). Jadi ukur lewat jadwal
  // ulang, ditambah event load, font siap, dan gambar selesai.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => fitFrame(el);
    const onLoad = () => {
      fit();
      el.contentDocument?.fonts?.ready.then(fit);
      el.contentDocument?.querySelectorAll("img").forEach((img) => img.addEventListener("load", fit, { once: true }));
    };
    el.addEventListener("load", onLoad);
    window.addEventListener("resize", fit);
    const timers = [0, 150, 600, 1500, 4000].map((ms) => setTimeout(onLoad, ms));
    return () => {
      el.removeEventListener("load", onLoad);
      window.removeEventListener("resize", fit);
      timers.forEach(clearTimeout);
    };
  }, [srcDoc]);

  return (
    <div className="overflow-x-auto rounded-lg bg-white">
      <iframe
        ref={ref}
        title="Isi email"
        srcDoc={srcDoc}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        style={{ height: 120 }}
        className="block w-full border-0 bg-white"
      />
    </div>
  );
}
