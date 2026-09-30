import type { ReactNode } from "react";

// Barisan kartu untuk landing (kolam, coach): di HP digeser ke samping dengan
// snap (kartu berikutnya mengintip supaya jelas bisa digeser), di layar lebar
// membungkus jadi 2-3 kolom dengan baris terakhir di tengah. Tinggi halaman
// jauh lebih pendek daripada menumpuk kartu satu per baris.
// Sengaja TANPA efek muncul-saat-scroll: item yang tersembunyi di luar layar
// (digeser ke samping) tidak pernah kena pengamat scroll, jadi tetap kosong.
export function Rail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul
      aria-label={label}
      className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </ul>
  );
}

// Lebar tiap item: 1,2 kartu di HP, 2 kolom di md, 3 kolom di lg.
export const RAIL_ITEM = "w-[82%] shrink-0 snap-start sm:w-[46%] md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]";

// Coach tampil maksimal 5: satu baris penuh di layar lebar (lg+), 3 kolom di
// tablet, digeser di HP.
export const RAIL_ITEM_FIVE = "w-[72%] shrink-0 snap-start sm:w-[calc(33.333%-0.7rem)] lg:w-[calc(20%-0.8rem)]";
