import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Nilai di bawah ini SENGAJA duplikat dari token asli di src/app/globals.css
// (blok :root dan :root[data-theme="dark"]) -- kalau token di sana berubah,
// perbarui juga di sini. Duplikasi dipilih daripada baca file CSS saat build
// karena scope ini harus menampilkan tema terang & gelap BERDAMPINGAN di
// halaman yang sama, tanpa ikut toggle tema situs (data-theme di <html>).
// Caranya: variabel CSS di-override lokal pada elemen ini lewat inline
// style, lalu di-warisi turun oleh semua utility Tailwind (bg-surface,
// text-text, dst) yang dipakai anak-anaknya -- <html> sama sekali tidak
// disentuh, jadi toggle tema situs sendiri tidak terpengaruh.
const THEME_VARS: Record<"light" | "dark", CSSProperties> = {
  light: {
    "--background": "#f6f6ee",
    "--foreground": "#14140f",
    "--color-brand-50": "#f1fbdd",
    "--color-brand-100": "#e3f5b0",
    "--color-brand-500": "#9fcc1f",
    "--color-brand-600": "#14140f",
    "--color-brand-700": "#14140f",
    "--color-accent-50": "#fff1f2",
    "--color-accent-100": "#ffe4e6",
    "--color-accent-500": "#f43f5e",
    "--color-accent-600": "#e11d48",
    "--color-surface": "#ffffff",
    "--color-surface-muted": "#ece9dc",
    "--color-border": "#dedaca",
    "--color-text": "#14140f",
    "--color-text-muted": "#5c5945",
    "--color-text-subtle": "#6c6957",
    "--color-success-bg": "#ecfdf5",
    "--color-success-text": "#047857",
    "--color-warning-bg": "#fffbeb",
    "--color-warning-text": "#a8480a",
    "--color-danger-bg": "#fef2f2",
    "--color-danger-text": "#b91c1c",
    "--color-disabled-bg": "#dedbd0",
    "--color-disabled-text": "#8e8a78",
    "--color-whatsapp": "#0f7a3c",
    "--color-whatsapp-text": "#0f7a3c",
    colorScheme: "light",
  } as CSSProperties,
  dark: {
    "--background": "#191a17",
    "--foreground": "#e8e6dc",
    "--color-brand-50": "#2a3119",
    "--color-brand-100": "#333d1c",
    "--color-brand-500": "#bde85a",
    "--color-brand-600": "#5a7a12",
    "--color-brand-700": "#b9e063",
    "--color-accent-50": "#3d1a22",
    "--color-accent-100": "#5c2230",
    "--color-accent-500": "#f28b9c",
    "--color-accent-600": "#f5a8b5",
    "--color-surface": "#282a25",
    "--color-surface-muted": "#32342e",
    "--color-border": "#4a4c44",
    "--color-text": "#e8e6dc",
    "--color-text-muted": "#b6b3a5",
    "--color-text-subtle": "#a09d8f",
    "--color-success-bg": "#1b3a2d",
    "--color-success-text": "#6fd6a8",
    "--color-warning-bg": "#3d2f12",
    "--color-warning-text": "#f2c14e",
    "--color-danger-bg": "#3f2023",
    "--color-danger-text": "#f29191",
    "--color-disabled-bg": "#3d3f39",
    "--color-disabled-text": "#7c7e76",
    "--color-whatsapp": "#0f7a3c",
    "--color-whatsapp-text": "#3fcf7c",
    colorScheme: "dark",
  } as CSSProperties,
};

const THEME_LABEL: Record<"light" | "dark", string> = {
  light: "Terang",
  dark: "Gelap",
};

export function ThemeScope({
  theme,
  className,
  bare = false,
  children,
}: {
  theme: "light" | "dark";
  className?: string;
  /** Tanpa label & padding kartu -- buat dipakai di dalam grid yang sudah kasih bingkainya sendiri. */
  bare?: boolean;
  children: ReactNode;
}) {
  if (bare) {
    return (
      <div className={cn("bg-background text-foreground", className)} style={THEME_VARS[theme]}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-2xl border border-border bg-background p-4 text-foreground", className)}
      style={THEME_VARS[theme]}
    >
      <span className="mb-3 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-text-subtle">
        {THEME_LABEL[theme]}
      </span>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
