import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoachLeaders } from "./coach-leaders";
import type { LandingCoach } from "./landing-view";

const base: LandingCoach = { id: "c1", name: "Dewi Lestari", bio: null, specialties: ["Gaya bebas"], photoUrl: null, certifiedLabel: null, bioLine: "30 tahun · Perempuan", pools: ["Kolam Melati"] };

describe("CoachLeaders", () => {
  it("menampilkan nama, keahlian, kolam, dan tautan profil; tanpa foto memakai inisial", () => {
    render(<CoachLeaders coaches={[base]} />);
    expect(screen.getByRole("heading", { name: "Dewi Lestari" })).toBeInTheDocument();
    expect(screen.getByText("DL")).toBeInTheDocument();
    expect(screen.getByText("Gaya bebas")).toBeInTheDocument();
    expect(screen.getByText("Kolam Melati")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lihat profil lengkap" })).toHaveAttribute("href", "/pelatih/c1");
  });

  it("badge sertifikat hanya tampil bila sudah ada yang disetujui; foto dipakai bila ada", () => {
    const { rerender } = render(<CoachLeaders coaches={[base]} />);
    expect(screen.queryByText(/Bersertifikat/)).toBeNull();
    rerender(<CoachLeaders coaches={[{ ...base, certifiedLabel: "Bersertifikat · FASI", photoUrl: "https://x.test/a.jpg" }]} />);
    expect(screen.getByText("Bersertifikat · FASI")).toBeInTheDocument();
    expect(screen.getByAltText("Foto Dewi Lestari")).toHaveAttribute("src", "https://x.test/a.jpg");
  });

  it("kolam mengajar dipendekkan: dua nama pertama + jumlah sisanya", () => {
    render(<CoachLeaders coaches={[{ ...base, pools: ["Kolam A", "Kolam B", "Kolam C", "Kolam D"] }]} />);
    expect(screen.getByText("Kolam A, Kolam B +2")).toBeInTheDocument();
  });

  it("satu daftar berlabel dengan satu item per coach (tanpa efek muncul-saat-scroll yang menyembunyikan kartu)", () => {
    render(<CoachLeaders coaches={[base, { ...base, id: "c2", name: "Rian" }]} />);
    const list = screen.getByRole("list", { name: "Daftar coach" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
  });
});

describe("TestimonialsSection layout", () => {
  it("dua testimoni memakai grid dua kolom", async () => {
    const { TestimonialsSection } = await import("./landing-testimonials");
    const { container } = render(<TestimonialsSection items={[{ name: "A", role: "r", quote: "q1" }, { name: "B", role: "r", quote: "q2" }]} />);
    expect(container.querySelector("ul")?.className).toContain("md:grid-cols-2");
  });
});
