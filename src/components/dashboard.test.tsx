import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SegmentBar, NextStepCard, BalanceCard } from "./dashboard";

describe("SegmentBar", () => {
  it("satu segmen per sesi, yang terpakai tidak menyala", () => {
    const { container } = render(<SegmentBar sisa={3} total={8} />);
    expect(screen.getByRole("img", { name: "Sisa 3 dari 8 sesi" })).toBeTruthy();
    const segs = container.querySelectorAll("span");
    expect(segs).toHaveLength(8);
    expect([...segs].filter((s) => s.className.includes("bg-brand-500"))).toHaveLength(3);
  });

  it("sisa dibatasi 0..total", () => {
    render(<SegmentBar sisa={-2} total={4} />);
    expect(screen.getByRole("img", { name: "Sisa 0 dari 4 sesi" })).toBeTruthy();
    render(<SegmentBar sisa={9} total={4} />);
    expect(screen.getByRole("img", { name: "Sisa 4 dari 4 sesi" })).toBeTruthy();
  });

  it("lebih dari 16 sesi = satu batang proporsional", () => {
    const { container } = render(<SegmentBar sisa={10} total={20} />);
    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect((container.querySelector("[style]") as HTMLElement).style.width).toBe("50%");
  });

  it("total 0 tidak menampilkan apa pun", () => {
    const { container } = render(<SegmentBar sisa={0} total={0} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("NextStepCard", () => {
  it("kartu gelap: badge, kicker, judul besar, tombol ke tujuan", () => {
    render(<NextStepCard badge="dalam 1 hari" kicker="Senin, 5 Oktober" title="16.00–17.00" href="/member/booking" cta="Booking" />);
    expect(screen.getByText("dalam 1 hari")).toBeTruthy();
    expect(screen.getByText("Senin, 5 Oktober")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Booking" }).getAttribute("href")).toBe("/member/booking");
    expect(screen.getByLabelText("Langkah berikutnya").className).toContain("bg-hero");
  });

  it("tone soft memakai kartu lembut, tanpa tombol bila tidak ada tujuan", () => {
    render(<NextStepCard tone="soft" title="Semua beres" />);
    expect(screen.getByLabelText("Langkah berikutnya").className).toContain("bg-brand-50");
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("BalanceCard", () => {
  it("menampilkan saldo dan tautan ke halaman Saldo", () => {
    render(<BalanceCard label="Saldo" amount="Rp 172.250" href="/coach/saldo" cta="Cairkan saldo" />);
    expect(screen.getByText("Rp 172.250")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cairkan saldo" }).getAttribute("href")).toBe("/coach/saldo");
  });
});
