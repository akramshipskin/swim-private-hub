// Kelompokkan slot sehari per jam (WIB) buat tampilan "jam ramai" kolam.
export type OccupancySlot = { startTime: Date; endTime: Date; booked: boolean; coachName: string; who?: string };

export function hourOfWib(d: Date): number {
  return Number(d.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }));
}

export function groupByHour(slots: OccupancySlot[], openTime: string | null, closeTime: string | null) {
  const hours = slots.map((s) => hourOfWib(s.startTime));
  const open = openTime ? Number(openTime.slice(0, 2)) : Math.min(6, ...hours);
  const close = closeTime ? Number(closeTime.slice(0, 2)) : Math.max(21, ...hours.map((h) => h + 1));
  const rows: { hour: number; booked: OccupancySlot[]; open: OccupancySlot[] }[] = [];
  for (let h = open; h < close; h++) {
    const inHour = slots.filter((s) => hourOfWib(s.startTime) === h);
    rows.push({ hour: h, booked: inHour.filter((s) => s.booked), open: inHour.filter((s) => !s.booked) });
  }
  return rows;
}
