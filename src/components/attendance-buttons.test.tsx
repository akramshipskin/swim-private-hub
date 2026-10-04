import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { markAttendance, refresh } = vi.hoisted(() => ({ markAttendance: vi.fn(), refresh: vi.fn() }));
vi.mock("@/app/coach/riwayat-sesi/actions", () => ({ markAttendance }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import AttendanceButtons from "./attendance-buttons";

beforeEach(() => {
  vi.clearAllMocks();
  markAttendance.mockResolvedValue(null);
});

describe("AttendanceButtons", () => {
  it("Hadir -> konfirmasi -> aksi dipanggil sekali dengan attended=true", async () => {
    render(<AttendanceButtons bookingId="b1" />);
    fireEvent.click(screen.getByRole("button", { name: "Hadir" }));
    expect(markAttendance).not.toHaveBeenCalled(); // belum dikonfirmasi
    fireEvent.click(screen.getByRole("button", { name: "Ya, tandai Hadir" }));
    await waitFor(() => expect(markAttendance).toHaveBeenCalledTimes(1));
    const fd = markAttendance.mock.calls[0][1] as FormData;
    expect(fd.get("bookingId")).toBe("b1");
    expect(fd.get("attended")).toBe("true");
  });

  it("Tidak hadir -> konfirmasi -> attended=false", async () => {
    render(<AttendanceButtons bookingId="b2" />);
    fireEvent.click(screen.getByRole("button", { name: "Tidak hadir" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya, tandai Tidak Hadir" }));
    await waitFor(() => expect(markAttendance).toHaveBeenCalledTimes(1));
    expect((markAttendance.mock.calls[0][1] as FormData).get("attended")).toBe("false");
  });

  it("Batal di dialog tidak mengirim apa pun (jangan tercatat Tidak hadir)", async () => {
    render(<AttendanceButtons bookingId="b3" />);
    fireEvent.click(screen.getByRole("button", { name: "Tidak hadir" }));
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    await new Promise((r) => setTimeout(r, 50));
    expect(markAttendance).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lewat batas 24 jam: tombol diganti keterangan dan tidak bisa mengirim", () => {
    render(<AttendanceButtons bookingId="b4" lockedReason="Lewat 24 jam, hubungi admin" />);
    expect(screen.getByText("Lewat 24 jam, hubungi admin")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("galat dari server ditampilkan", async () => {
    markAttendance.mockResolvedValue({ error: "Sudah lewat 24 jam sejak sesi selesai." });
    render(<AttendanceButtons bookingId="b5" />);
    fireEvent.click(screen.getByRole("button", { name: "Hadir" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya, tandai Hadir" }));
    expect(await screen.findByText("Sudah lewat 24 jam sejak sesi selesai.")).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });
});
