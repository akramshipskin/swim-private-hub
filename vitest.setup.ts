import "@testing-library/jest-dom/vitest";

// Kunci uji untuk src/lib/secret-box.ts (bukan kunci dev/production).
process.env.SECRET_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
