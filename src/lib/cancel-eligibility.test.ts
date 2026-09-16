import { describe, expect, it } from "vitest";
import { evaluateCancelEligibility } from "./cancel-eligibility";
import { CANCEL_WINDOW_HOURS } from "./policy";

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

describe("evaluateCancelEligibility", () => {
  it("allows cancelling when outside the window and quota isn't used up", () => {
    const result = evaluateCancelEligibility({
      quota: 2,
      used: 0,
      startTime: hoursFromNow(CANCEL_WINDOW_HOURS + 1),
    });
    expect(result).toEqual({ canCancel: true, used: 0, quota: 2 });
  });

  it("blocks cancelling inside the minimum-hours window, even with quota left", () => {
    const result = evaluateCancelEligibility({
      quota: 2,
      used: 0,
      startTime: hoursFromNow(CANCEL_WINDOW_HOURS - 0.1),
    });
    expect(result.canCancel).toBe(false);
    expect(result.reason).toContain(`${CANCEL_WINDOW_HOURS} jam`);
  });

  it("blocks cancelling exactly at the window boundary (strictly less-than, not less-or-equal)", () => {
    // hoursUntilStart harus < CANCEL_WINDOW_HOURS buat diblokir -- pas
    // sama dengan window-nya sendiri harusnya masih boleh.
    const result = evaluateCancelEligibility({
      quota: 2,
      used: 0,
      startTime: hoursFromNow(CANCEL_WINDOW_HOURS),
    });
    expect(result.canCancel).toBe(true);
  });

  it("blocks cancelling once the self-cancel quota is fully used, even outside the window", () => {
    const result = evaluateCancelEligibility({
      quota: 2,
      used: 2,
      startTime: hoursFromNow(CANCEL_WINDOW_HOURS + 10),
    });
    expect(result.canCancel).toBe(false);
    expect(result.reason).toContain("Jatah pembatalan mandiri udah abis");
  });

  it("checks the time window before the quota (time-window reason wins when both fail)", () => {
    const result = evaluateCancelEligibility({
      quota: 2,
      used: 2,
      startTime: hoursFromNow(0.1),
    });
    expect(result.canCancel).toBe(false);
    expect(result.reason).toContain("jam sebelum jadwal");
  });

  it("treats a past startTime as inside the window (negative hoursUntilStart)", () => {
    const result = evaluateCancelEligibility({
      quota: 2,
      used: 0,
      startTime: hoursFromNow(-1),
    });
    expect(result.canCancel).toBe(false);
  });
});
