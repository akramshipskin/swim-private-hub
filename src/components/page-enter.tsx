import type { ReactNode } from "react";

// Dipasang lewat template.tsx di tiap area peran: Next membuat ulang template
// setiap pindah halaman, jadi animasi masuk (.page-enter di globals.css) jalan
// di setiap perpindahan menu, bukan hanya saat pertama dibuka.
export function PageEnter({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
