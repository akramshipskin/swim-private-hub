import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./actions", () => ({ updateName: vi.fn(async () => ({ success: true })) }));

import EditNameForm from "./edit-name-form";

describe("EditNameForm (pola Edit dulu baru Simpan)", () => {
  it("terkunci sampai klik Edit, Batal mengembalikan nilai awal dan mengunci lagi", async () => {
    const user = userEvent.setup();
    render(<EditNameForm currentName="Ayu" label="Nama" />);

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Edit Nama" }));
    const unlocked = screen.getByRole("textbox");
    expect(unlocked).toBeEnabled();
    await user.clear(unlocked);
    await user.type(unlocked, "Ayu Baru");

    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveValue("Ayu");
  });
});
