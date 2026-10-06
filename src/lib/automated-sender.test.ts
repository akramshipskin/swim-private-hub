import { describe, expect, it } from "vitest";
import { isAutomatedSender } from "./automated-sender";

describe("isAutomatedSender", () => {
  it.each([
    "noreply@midtrans.com",
    "no-reply@x.id",
    "NoReply@x.id",
    "do-not-reply@x.id",
    "donotreply@x.id",
    "no_reply+abc123@x.id",
    "MAILER-DAEMON@x.id",
    "Midtrans <noreply@midtrans.com>",
    "bounces@x.id",
  ])("%s = otomatis", (from) => {
    expect(isAutomatedSender(from)).toBe(true);
  });

  it.each(["cust@example.com", "Ibu Ani <ani@gmail.com>", "replyto@x.id", "noreplying@x.id", "support@noreply.com", "tanpa-at", ""])(
    "%s = manusia",
    (from) => {
      expect(isAutomatedSender(from)).toBe(false);
    },
  );
});
