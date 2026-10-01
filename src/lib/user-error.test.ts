import { describe, expect, it, vi } from "vitest";
import { userErrorMessage } from "./user-error";

describe("userErrorMessage", () => {
  it("pesan validasi buatan kita tampil apa adanya", () => {
    expect(userErrorMessage(new Error("Saldo tidak cukup."), "Gagal")).toBe("Saldo tidak cukup.");
  });

  it("error database/Prisma diganti pesan umum (tidak membocorkan nama file/kolom)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const prismaErr = Object.assign(new Error("Invalid `tx.coachProfile.updateMany()` invocation in /x/y.js"), { name: "PrismaClientKnownRequestError", clientVersion: "7" });
    expect(userErrorMessage(prismaErr, "Gagal ajukan pencairan")).toBe("Gagal ajukan pencairan");
    const unknownErr = Object.assign(new Error("Value out of range"), { clientVersion: "7" });
    expect(userErrorMessage(unknownErr, "Gagal")).toBe("Gagal");
    expect(userErrorMessage("string", "Gagal")).toBe("Gagal");
    spy.mockRestore();
  });
});
