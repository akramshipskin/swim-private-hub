import { describe, expect, it } from "vitest";
import { dbConnectionConfig } from "./db-ssl";

describe("dbConnectionConfig", () => {
  it("tanpa CA: alamat tidak diubah", () => {
    expect(dbConnectionConfig({ DATABASE_URL: "postgresql://u:p@h:5432/db?sslmode=require" })).toEqual({
      connectionString: "postgresql://u:p@h:5432/db?sslmode=require",
    });
  });
  it("dengan CA: verifikasi penuh, parameter ssl di alamat dibuang, parameter lain tetap", () => {
    const cfg = dbConnectionConfig({
      DATABASE_URL: "postgresql://u:p@h:6543/db?sslmode=no-verify&pgbouncer=true",
      DATABASE_CA_CERT: "-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----",
    });
    expect(cfg.connectionString).toBe("postgresql://u:p@h:6543/db?pgbouncer=true");
    expect(cfg.ssl).toEqual({ ca: "-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----", rejectUnauthorized: true });
  });
});
