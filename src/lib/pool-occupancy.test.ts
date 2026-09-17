import { describe, expect, it } from "vitest";
import { groupByHour, hourOfWib } from "./pool-occupancy";

const at = (hhmm: string) => new Date(`2026-09-17T${hhmm}:00+07:00`);

describe("pool occupancy", () => {
  it("reads the hour in WIB, not server time", () => {
    expect(hourOfWib(at("07:00"))).toBe(7);
  });

  it("buckets booked and open slots per hour between open and close time", () => {
    const rows = groupByHour(
      [
        { startTime: at("07:00"), endTime: at("08:00"), booked: true, coachName: "Ayu", who: "Bimo" },
        { startTime: at("07:00"), endTime: at("08:00"), booked: false, coachName: "Rian" },
      ],
      "06:00",
      "09:00"
    );
    expect(rows.map((r) => r.hour)).toEqual([6, 7, 8]);
    expect(rows[1].booked).toHaveLength(1);
    expect(rows[1].open).toHaveLength(1);
    expect(rows[0].booked).toHaveLength(0);
  });
});
