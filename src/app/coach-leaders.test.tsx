import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CoachLeaders, lanePath } from "./coach-leaders";
import type { LandingCoach } from "./landing-view";

const coach = (n: number) =>
  ({ id: `c${n}`, name: `Coach ${n}`, photoUrl: null, specialties: ["Gaya bebas"], pools: ["Kolam A"], bio: "Bio", bioLine: "30 tahun", certifiedLabel: null }) as unknown as LandingCoach;

describe("lanePath", () => {
  it("mulai dari tengah atas dan berakhir di tinggi daftar (5 kartu = 5x36 + 4x5 rem)", () => {
    const { d, height } = lanePath(5);
    expect(height).toBe(200);
    expect(d.startsWith("M 50 0 ")).toBe(true);
    expect(d.endsWith(" 50 200")).toBe(true);
  });

  it("melewati pusat tiap kartu: kiri, kanan, tengah", () => {
    const { d } = lanePath(3);
    expect(d).toContain(", 18 18");
    expect(d).toContain(", 82 59");
    expect(d).toContain(", 50 100");
  });
});

describe("CoachLeaders", () => {
  it("satu kartu per coach, dua lapis tali lintasan, kartu tahu arah masuknya", () => {
    const { container } = render(<CoachLeaders coaches={[coach(1), coach(2), coach(3)]} />);
    const cards = container.querySelectorAll("li.fx-coach");
    expect(cards).toHaveLength(3);
    expect(["-1", "1", "0"]).toEqual([...cards].map((c) => (c as HTMLElement).style.getPropertyValue("--dir")));
    expect(container.querySelectorAll("svg.fx-coach-lane, svg.fx-coach-lane-draw")).toHaveLength(2);
  });
});
