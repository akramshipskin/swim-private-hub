import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ after: () => { throw new Error("di luar request"); } }));
const { buildPayload, hashedUserData, sendMetaEvent, trackingFromRequest } = await import("./meta-capi");

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const EVENT = {
  eventName: "Purchase" as const,
  eventId: "PKG-1",
  user: { userId: "u1", phone: "081234567890", email: " Ortu@Mail.COM " },
  tracking: { fbp: "fb.1.2.3", ua: "Mozilla", ip: "unknown" },
  sourceUrl: "https://x/pembayaran/sukses",
  value: 1_363_200,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("meta-capi", () => {
  it("nomor HP 08… di-hash sebagai 628…, email dirapikan dulu, id user di-hash", () => {
    expect(hashedUserData(EVENT.user)).toEqual({
      ph: [sha("6281234567890")],
      em: [sha("ortu@mail.com")],
      external_id: [sha("u1")],
    });
    expect(hashedUserData({ userId: "u2", phone: null, email: null })).toEqual({ external_id: [sha("u2")] });
  });

  it("payload: nilai dalam IDR, cookie Pixel & user agent ikut, IP 'unknown' dibuang", () => {
    const p = buildPayload(EVENT, new Date("2026-10-02T00:00:00Z"));
    const d = p.data[0];
    expect(d).toMatchObject({ event_name: "Purchase", event_id: "PKG-1", event_time: 1790899200, action_source: "website", custom_data: { value: 1_363_200, currency: "IDR" } });
    expect(d.user_data).toMatchObject({ fbp: "fb.1.2.3", client_user_agent: "Mozilla" });
    expect(d.user_data).not.toHaveProperty("client_ip_address");
    // Data mentah tidak pernah ikut terkirim.
    expect(JSON.stringify(p)).not.toContain("081234567890");
    expect(JSON.stringify(p)).not.toContain("Ortu@Mail");
  });

  it("membaca cookie _fbp/_fbc dan user agent dari permintaan", () => {
    const req = new Request("http://x", { headers: { cookie: "a=1; _fbp=fb.1.9.9; _fbc=fb.1.8.abc", "user-agent": "UA" } });
    expect(trackingFromRequest(req)).toEqual({ fbp: "fb.1.9.9", fbc: "fb.1.8.abc", ua: "UA" });
    expect(trackingFromRequest(new Request("http://x"))).toEqual({ fbp: undefined, fbc: undefined, ua: undefined });
  });

  it("env kosong: tidak memanggil Meta sama sekali", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
    vi.stubEnv("META_CAPI_TOKEN", "");
    await sendMetaEvent(EVENT);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aktif: kirim ke Pixel yang benar; Meta menolak/jaringan putus tidak melempar error", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
    vi.stubEnv("META_CAPI_TOKEN", "tok");
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue(new Response("bad", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendMetaEvent(EVENT);
    expect(fetchMock.mock.calls[0][0]).toMatch(/^https:\/\/graph\.facebook\.com\/v21\.0\/123\/events\?access_token=tok$/);
    fetchMock.mockRejectedValueOnce(new Error("timeout"));
    await expect(sendMetaEvent(EVENT)).resolves.toBeUndefined();
    // Log tidak memuat token.
    expect(err.mock.calls.flat().join(" ")).not.toContain("tok");
    err.mockRestore();
  });
});
