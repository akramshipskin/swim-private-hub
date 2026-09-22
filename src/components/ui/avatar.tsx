import { cn } from "@/lib/cn";

// Foto profil coach. Belum upload foto = siluet default (seperti medsos),
// bukan inisial, supaya semua kartu coach tampil seragam.
export function Avatar({ src, alt = "", className }: { src?: string | null; alt?: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn("shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <svg
      viewBox="0 0 64 64"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn("shrink-0 rounded-full bg-surface-muted text-text-subtle", className)}
    >
      <circle cx="32" cy="25" r="11" fill="currentColor" />
      <path d="M11 58c2-12 10.5-18 21-18s19 6 21 18z" fill="currentColor" />
    </svg>
  );
}
