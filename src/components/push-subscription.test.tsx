import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PushMenuItem } from "./push-subscription";

describe("PushMenuItem", () => {
  it("offers an enable button that calls enable() when the browser supports push", async () => {
    const enable = vi.fn();
    render(<PushMenuItem supported status="idle" enable={enable} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktifkan Notifikasi" }));
    expect(enable).toHaveBeenCalledTimes(1);
  });

  it("disables the button while enabling", () => {
    render(<PushMenuItem supported status="loading" enable={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Mengaktifkan..." })).toBeDisabled();
  });

  it("shows a status line instead of a button once subscribed", () => {
    render(<PushMenuItem supported status="subscribed" enable={vi.fn()} />);
    expect(screen.getByText("Notifikasi aktif")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("explains an unsupported browser without offering the button", () => {
    render(<PushMenuItem supported={false} status="idle" enable={vi.fn()} />);
    expect(screen.getByText("Notifikasi tidak didukung browser ini")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the button and shows the permission hint after an error", () => {
    render(<PushMenuItem supported status="error" enable={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Aktifkan Notifikasi" })).toBeEnabled();
    expect(screen.getByText(/Izin notifikasi ditolak/)).toBeInTheDocument();
  });
});
