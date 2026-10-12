import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  it("menampilkan foto bila ada", () => {
    const { container } = render(<Avatar src="/a.jpg" alt="Foto Coach" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/a.jpg");
  });

  it("jatuh ke siluet saat foto gagal dimuat", () => {
    const { container } = render(<Avatar src="/rusak.jpg" alt="Foto Coach" />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Foto Coach");
  });

  it("siluet bila belum ada foto", () => {
    const { container } = render(<Avatar alt="" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
