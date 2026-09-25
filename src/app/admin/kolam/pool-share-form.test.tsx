import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./actions", () => ({ updatePoolShares: vi.fn(async () => null) }));

import PoolShareForm from "./pool-share-form";

// Temuan sweep OpenCode R1: kolom dikosongkan dulu jadi 0 lalu tersimpan
// sebagai komisi 0% tanpa peringatan.
describe("PoolShareForm kolom kosong", () => {
  it("tidak mengubah kolom kosong jadi 0 dan mengunci Simpan", async () => {
    const user = userEvent.setup();
    const { container } = render(<PoolShareForm poolId="p1" commissionPercent={15} coachSharePercent={55} />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await new Promise((r) => setTimeout(r, 450));

    const [platform] = screen.getAllByRole("spinbutton");
    await user.clear(platform);

    expect(platform).toHaveValue(null);
    expect(container.querySelector('input[name="commissionPercent"]')).toHaveValue("");
    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled();
    expect(screen.getByText("Semua kolom komisi wajib diisi (0-100).")).toBeInTheDocument();

    await user.type(platform, "20");
    expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled();
    expect(container.querySelector('input[name="commissionPercent"]')).toHaveValue("20");
  });
});
