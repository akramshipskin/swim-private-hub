import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Loader } from "./loader";
import { Button } from "./button";

describe("Loader", () => {
  it("merender orb (canvas) dengan label status", () => {
    const { container } = render(<Loader label="Memuat jadwal" />);
    expect(screen.getByRole("status", { name: "Memuat jadwal" })).toBeInTheDocument();
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("tombol dengan loading menampilkan orb dan tidak bisa diklik", () => {
    const { container } = render(<Button loading>Simpan</Button>);
    expect(container.querySelector("canvas")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Simpan/ })).toBeDisabled();
  });
});
