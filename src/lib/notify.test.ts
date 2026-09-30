import { describe, expect, it, vi } from "vitest";

const sendPushToRole = vi.fn();
const sendPushToUser = vi.fn();
vi.mock("@/lib/push", () => ({
  sendPushToRole: (...a: unknown[]) => sendPushToRole(...a),
  sendPushToUser: (...a: unknown[]) => sendPushToUser(...a),
}));
const { notifyAdmins, notifyUser } = await import("./notify");

describe("notify", () => {
  it("notifyAdmins mengirim ke role ADMIN", async () => {
    sendPushToRole.mockResolvedValue(undefined);
    await notifyAdmins("T", "B", "/admin/users");
    expect(sendPushToRole).toHaveBeenCalledWith("ADMIN", { title: "T", body: "B", url: "/admin/users" });
  });

  it("notifyUser mengirim ke satu pengguna", async () => {
    sendPushToUser.mockResolvedValue(undefined);
    await notifyUser("u1", "T", "B", "/profil");
    expect(sendPushToUser).toHaveBeenCalledWith("u1", { title: "T", body: "B", url: "/profil" });
  });

  it("gagal kirim tidak melempar error ke aksi utamanya", async () => {
    sendPushToRole.mockRejectedValue(new Error("db mati"));
    sendPushToUser.mockRejectedValue(new Error("db mati"));
    await expect(notifyAdmins("T", "B", "/x")).resolves.toBeUndefined();
    await expect(notifyUser("u", "T", "B", "/x")).resolves.toBeUndefined();
  });
});
