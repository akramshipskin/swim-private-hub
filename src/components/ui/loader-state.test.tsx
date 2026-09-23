import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

const orb = vi.fn((_props: unknown) => null);
vi.mock("thinking-orbs", () => ({ ThinkingOrb: (props: unknown) => orb(props) }));

const { Loader } = await import("./loader");

describe("Loader state", () => {
  it("memakai state composing di kedua ukuran", () => {
    render(<Loader />);
    render(<Loader size={20} />);
    expect(orb).toHaveBeenCalledWith(expect.objectContaining({ state: "composing", size: 64 }));
    expect(orb).toHaveBeenCalledWith(expect.objectContaining({ state: "composing", size: 20 }));
  });
});
