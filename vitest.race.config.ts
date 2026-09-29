import { defineConfig } from "vitest/config";
import path from "node:path";

// Tes race condition terhadap Postgres LOKAL sungguhan (bukan mock).
// Jalankan: Postgres 17 (sama dengan production) di localhost:54329 dengan
// user/password qa, database "race", schema di-deploy lewat migrasi, lalu
// `npm run test:race`. Setup menolak jalan kalau DATABASE_URL bukan lokal.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/race/**/*.race.test.ts"],
    setupFiles: ["./tests/race/setup.ts"],
    fileParallelism: false,
    testTimeout: 90000,
    hookTimeout: 90000,
    env: {
      DATABASE_URL: "postgresql://qa:qa@localhost:54329/race",
      DIRECT_URL: "postgresql://qa:qa@localhost:54329/race",
      MIDTRANS_SERVER_KEY: "SB-test-server-key",
      MIDTRANS_CLIENT_KEY: "SB-test-client-key",
      AUTH_SECRET: "race-test-secret",
      // Kunci enkripsi KHUSUS tes (sama dengan vitest.setup.ts), bukan kunci dev/prod.
      SECRET_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
