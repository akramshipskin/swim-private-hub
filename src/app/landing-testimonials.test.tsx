import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestimonialsSection } from "./landing-testimonials";

describe("TestimonialsSection", () => {
  it("tersembunyi total kalau belum ada testimoni asli", () => {
    const { container } = render(<TestimonialsSection items={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Kata mereka")).toBeNull();
  });

  it("tampil dengan isi, nama, dan peran kalau ada testimoni", () => {
    render(
      <TestimonialsSection
        items={[{ name: "Bunda Rani", role: "Orang tua", quote: "Anak saya jadi berani masuk air." }]}
      />,
    );
    expect(screen.getByText("Kata mereka")).toBeInTheDocument();
    expect(screen.getByText(/Anak saya jadi berani masuk air/)).toBeInTheDocument();
    expect(screen.getByText("Bunda Rani")).toBeInTheDocument();
    expect(screen.getByText(/Orang tua/)).toBeInTheDocument();
  });
});
