import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const signIn = vi.fn();
vi.mock("next-auth/react", () => ({ signIn: (...a: unknown[]) => signIn(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import LoginForm from "./login-form";

beforeEach(() => signIn.mockReset());

// Form login tidak tahu peran akun: kolom kode muncul untuk SIAPA PUN yang
// dibalas otp_required (admin wajib, coach/member/pemilik kolam opsional).
describe("LoginForm 2FA", () => {
  it("otp_required -> kolom kode muncul tanpa pesan salah; kode dikirim di percobaan berikutnya; otp_invalid -> pesan kode salah", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("No HP atau Email"), "081200000001");
    await user.type(screen.getByLabelText("Password"), "rahasia123");

    signIn.mockResolvedValueOnce({ error: "CredentialsSignin", code: "otp_required" });
    await user.click(screen.getByRole("button", { name: "Masuk" }));
    const otp = await screen.findByLabelText("Kode 2FA (Google Authenticator)");
    expect(screen.queryByRole("alert")).toBeNull();

    signIn.mockResolvedValueOnce({ error: "CredentialsSignin", code: "otp_invalid" });
    await user.type(otp, "123456");
    await user.click(screen.getByRole("button", { name: "Masuk" }));
    expect(signIn).toHaveBeenLastCalledWith("credentials", expect.objectContaining({ identifier: "081200000001", otp: "123456" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Kode 2FA salah atau sudah dipakai");
  });

  it("tanpa 2FA: salah password -> pesan umum, kolom kode tidak muncul", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("No HP atau Email"), "081200000001");
    await user.type(screen.getByLabelText("Password"), "salah");
    signIn.mockResolvedValueOnce({ error: "CredentialsSignin", code: "credentials" });
    await user.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("password salah");
    expect(screen.queryByLabelText("Kode 2FA (Google Authenticator)")).toBeNull();
  });
});
