import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileInput } from "./file-input";

describe("FileInput", () => {
  it("menampilkan nama file yang dipilih", () => {
    const { container } = render(<FileInput name="photo" />);
    expect(screen.getByText("Belum ada file dipilih")).toBeTruthy();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "foto-coach.jpg", { type: "image/jpeg" })] } });
    expect(screen.getByText("foto-coach.jpg")).toBeTruthy();
  });

  it("isian asli tetap membawa name dan required", () => {
    const { container } = render(<FileInput name="certificate" required />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.name).toBe("certificate");
    expect(input.required).toBe(true);
  });
});
