import { describe, it, expect } from "vitest";
import { isAllowedPushEndpoint } from "./push-endpoint";

describe("isAllowedPushEndpoint", () => {
  it("menerima layanan push resmi (https)", () => {
    for (const u of [
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://web.push.apple.com/abc",
      "https://wns2-par02p.notify.windows.com/w/?token=abc",
    ]) expect(isAllowedPushEndpoint(u), u).toBe(true);
  });

  it("menolak host lain, http, port/kredensial, alamat internal, dan tiruan nama", () => {
    for (const u of [
      "http://fcm.googleapis.com/x",
      "https://evil.example.com/x",
      "https://fcm.googleapis.com.evil.com/x",
      "https://evilfcm.googleapis.com.attacker.io/x",
      "https://169.254.169.254/latest/meta-data",
      "https://localhost/x",
      "https://user:pw@fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8443/x",
      "not a url",
      "",
    ]) expect(isAllowedPushEndpoint(u), u).toBe(false);
  });

  it("menolak bukan string dan yang terlalu panjang", () => {
    expect(isAllowedPushEndpoint(undefined)).toBe(false);
    expect(isAllowedPushEndpoint({})).toBe(false);
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/" + "a".repeat(1100))).toBe(false);
  });
});
