"use client";

import { useRef, useState } from "react";

// Isi email HTML ditampilkan di iframe tanpa skrip dan tanpa form
// (sandbox tanpa allow-scripts), jadi aman walau pengirimnya tidak dikenal.
// allow-same-origin hanya supaya tingginya bisa disesuaikan dengan isi.
// ponytail: tinggi dihitung sekali saat dimuat; isi yang berubah tinggi sesudahnya
// (jarang pada email) tidak diikuti.
export default function EmailBody({ srcDoc }: { srcDoc: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);
  const fit = () => {
    const doc = ref.current?.contentDocument;
    if (doc) setHeight(Math.min(Math.max(doc.documentElement.scrollHeight, 60), 6000));
  };
  return (
    <iframe
      ref={ref}
      title="Isi email"
      srcDoc={srcDoc}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      onLoad={fit}
      style={{ height }}
      className="w-full rounded-lg border-0 bg-white"
    />
  );
}
