import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { POLICY, sanitizeRow, shouldCopyTable } from "./dev-db-sanitize.mjs";

// Kolom skalar per model, dibaca dari schema.prisma (relasi tidak ikut:
// bukan kolom di tabel).
function schemaColumns() {
  const schema = readFileSync(path.join(import.meta.dirname, "../prisma/schema.prisma"), "utf8");
  const enums = new Set([...schema.matchAll(/^enum (\w+)/gm)].map((m) => m[1]));
  const scalar = new Set(["String", "Int", "Boolean", "DateTime", "Json", "Float", "Decimal", "BigInt", "Bytes", ...enums]);
  const out = {};
  for (const [, model, body] of schema.matchAll(/^model (\w+) \{\n([\s\S]*?)\n\}/gm)) {
    out[model] = body
      .split("\n")
      .map((l) => l.match(/^  (\w+)\s+(\w+)/))
      .filter((m) => m && scalar.has(m[2]))
      .map((m) => m[1])
      .sort();
  }
  return out;
}

const ctx = { devPasswordHash: "$2b$10$devhash" };

describe("dev-db-sanitize", () => {
  it("classifies exactly every table and column in schema.prisma", () => {
    const schema = schemaColumns();
    expect(Object.keys(POLICY).sort()).toEqual(Object.keys(schema).sort());
    for (const [table, cols] of Object.entries(schema)) {
      if (POLICY[table] === null) continue;
      expect([table, Object.keys(POLICY[table]).sort()]).toEqual([table, cols]);
    }
  });

  it("removes personal data and login secrets from a user row", () => {
    const row = {
      id: "u1", name: "Budi Santoso", email: "budi@gmail.com", phone: "081234567890",
      passwordHash: "$2b$10$REALHASH", role: "MEMBER", isActive: true, mustChangePassword: false,
      sessionVersion: 3, createdAt: "2026-09-01", registeredReferer: "https://ig.me/x", registeredIp: "36.1.2.3",
      termsAcceptedAt: "2026-09-01", termsVersion: "v1", totpSecret: "JBSWY3DPEHPK3PXP", totpEnabledAt: "2026-09-02",
      totpLastStep: 123, deletionRequestedAt: null, anonymizedAt: null, approvedAt: null,
    };
    const out = sanitizeRow("User", row, 7, ctx);
    const text = JSON.stringify(out);
    for (const secret of ["Budi", "budi@gmail.com", "081234567890", "REALHASH", "36.1.2.3", "ig.me", "JBSWY3DPEHPK3PXP"]) {
      expect(text).not.toContain(secret);
    }
    expect(out).toMatchObject({ id: "u1", role: "MEMBER", sessionVersion: 3, name: "Member 7", phone: "089900000007", email: "user7@dev.invalid", passwordHash: ctx.devPasswordHash, totpSecret: null, totpEnabledAt: null, totpLastStep: null });
  });

  it("keeps a null email null and gives unique phones per row", () => {
    const base = { id: "x", role: "COACH", email: null, phone: "081200000001" };
    const a = sanitizeRow("User", base, 1, ctx);
    const b = sanitizeRow("User", base, 2, ctx);
    expect(a.email).toBeNull();
    expect(a.phone).not.toBe(b.phone);
  });

  it("masks bank data but keeps money amounts", () => {
    const out = sanitizeRow("WithdrawalRequest", { id: "w1", amount: 51563, bankName: "BRI", bankAccountNumber: "1234567890", bankAccountName: "Ani", transferReference: "TRX-99", midtransReferenceId: null }, 1, ctx);
    expect(out.amount).toBe(51563);
    expect(JSON.stringify(out)).not.toMatch(/1234567890|Ani|TRX-99|BRI/);
    expect(out.midtransReferenceId).toBeNull();
  });

  it("masks chat and email content", () => {
    expect(sanitizeRow("ChatMessage", { id: "c", content: "rekening saya 123" }, 1, ctx).content).not.toContain("123");
    const mail = sanitizeRow("EmailMessage", { id: "e", threadId: "t1", direction: "INBOUND", fromAddress: "ortu@gmail.com", toAddress: "hello@swimprivatehub.biz.id", subject: "Refund anak saya", textBody: "Nama anak Sinta", htmlBody: "<p>Sinta</p>", resendId: "re_1" }, 1, ctx);
    expect(JSON.stringify(mail)).not.toMatch(/gmail|swimprivatehub|Sinta|Refund|re_1/);
  });

  it("skips push subscriptions and rate-limit keys entirely", () => {
    expect(shouldCopyTable("PushSubscription")).toBe(false);
    expect(shouldCopyTable("RateLimitHit")).toBe(false);
    expect(shouldCopyTable("Booking")).toBe(true);
  });

  it("fails closed on an unclassified table or column", () => {
    expect(() => shouldCopyTable("NewTable")).toThrow(/belum diklasifikasi/);
    expect(() => sanitizeRow("Dependent", { id: "d", nik: "3201" }, 1, ctx)).toThrow(/Dependent\.nik/);
  });
});
