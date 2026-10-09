import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadEmailMessageBody = vi.fn();
// Penolakan dibuat di luar vi.fn: pelacak hasil vitest ikut menolak dan dianggap error tak tertangani.
let serverDown = false;
vi.mock("./actions", () => ({
  loadEmailMessageBody: (...a: unknown[]) => (serverDown ? Promise.reject(new Error("jaringan")) : loadEmailMessageBody(...a)),
}));

const { default: MessageCard } = await import("./message-card");

const base = { id: "m1", inbound: true, name: "Budi", email: "budi@x.com", to: "hello@x.com", iso: "2026-10-09T00:00:00.000Z", timeLabel: "9 Okt 2026, 07.00", snippet: "potongan" };

beforeEach(() => {
  loadEmailMessageBody.mockReset();
  serverDown = false;
});

describe("MessageCard", () => {
  it("pesan terbaru terbuka sejak awal tanpa memanggil server", () => {
    render(<MessageCard {...base} initialBody={{ text: "isi lengkap", srcDoc: null }} />);
    expect(screen.getByText("isi lengkap")).toBeTruthy();
    expect(loadEmailMessageBody).not.toHaveBeenCalled();
  });

  it("pesan lama terlipat: tampil potongan, tanpa bingkai, isi diambil saat dibuka", async () => {
    loadEmailMessageBody.mockResolvedValue({ text: "isi lama", srcDoc: "<p>isi lama</p>" });
    const { container } = render(<MessageCard {...base} initialBody={null} />);
    expect(screen.getByText("potongan")).toBeTruthy();
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    await waitFor(() => expect(container.querySelector("iframe")).not.toBeNull());
    expect(loadEmailMessageBody).toHaveBeenCalledWith("m1");
  });

  it("dibuka lagi setelah ditutup tidak mengambil ulang", async () => {
    loadEmailMessageBody.mockResolvedValue({ text: "isi lama", srcDoc: null });
    render(<MessageCard {...base} initialBody={null} />);
    const head = screen.getByRole("button");
    fireEvent.click(head);
    await waitFor(() => expect(screen.getByText("isi lama")).toBeTruthy());
    fireEvent.click(head);
    expect(screen.queryByText("isi lama")).toBeNull();
    fireEvent.click(head);
    expect(screen.getByText("isi lama")).toBeTruthy();
    expect(loadEmailMessageBody).toHaveBeenCalledTimes(1);
  });

  it("gagal dimuat: tampil pesan dan Coba Lagi berhasil", async () => {
    loadEmailMessageBody.mockResolvedValueOnce({ error: "x" }).mockResolvedValueOnce({ text: "berhasil", srcDoc: null });
    render(<MessageCard {...base} initialBody={null} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText(/gagal dimuat/)).toBeTruthy());
    fireEvent.click(screen.getByText("Coba Lagi"));
    await waitFor(() => expect(screen.getByText("berhasil")).toBeTruthy());
  });

  it("server melempar error: tampil pesan gagal", async () => {
    serverDown = true;
    render(<MessageCard {...base} initialBody={null} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText(/gagal dimuat/)).toBeTruthy());
  });
});
