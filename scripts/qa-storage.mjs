// Penyimpanan file PALSU untuk uji lokal (meniru bagian kecil REST API Supabase
// Storage yang dipakai src/lib/storage.ts): unggah, hapus, tautan bertanda
// tangan, dan tautan publik. File disimpan di .dev-db/fake-storage (di-gitignore).
//
//   node scripts/qa-storage.mjs            -> http://localhost:54331
//
// Lalu isi .env.development.local (tidak ikut git):
//   SUPABASE_URL=http://localhost:54331
//   SUPABASE_SERVICE_ROLE_KEY=fake-local-key
// dan restart server dev. Hanya untuk localhost -- tidak pernah dipakai di produksi.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", ".dev-db", "fake-storage");
const PORT = 54331;
fs.mkdirSync(ROOT, { recursive: true });

// Cegah keluar dari ROOT lewat ../
const safe = (rel) => {
  const full = path.resolve(ROOT, rel);
  return full.startsWith(ROOT + path.sep) ? full : null;
};
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = decodeURIComponent(url.pathname);
    const send = (code, body, type = "application/json") => {
      res.writeHead(code, { "content-type": type });
      res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
    };

    let m;
    // Tautan bertanda tangan: POST /storage/v1/object/sign/<bucket>/<path>
    if (req.method === "POST" && (m = p.match(/^\/storage\/v1\/object\/sign\/(.+)$/))) {
      const f = safe(m[1]);
      if (!f || !fs.existsSync(f)) return send(404, { error: "not found" });
      return send(200, { signedURL: `/object/sign-get/${m[1]}?token=fake` });
    }
    // Unggah: POST /storage/v1/object/<bucket>/<path>
    if (req.method === "POST" && (m = p.match(/^\/storage\/v1\/object\/(.+)$/))) {
      const f = safe(m[1]);
      if (!f) return send(400, { error: "bad path" });
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        fs.mkdirSync(path.dirname(f), { recursive: true });
        fs.writeFileSync(f, Buffer.concat(chunks));
        send(200, { Key: m[1] });
      });
      return;
    }
    // Hapus: DELETE /storage/v1/object/<bucket>/<path>
    if (req.method === "DELETE" && (m = p.match(/^\/storage\/v1\/object\/(.+)$/))) {
      const f = safe(m[1]);
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
      return send(200, { message: "ok" });
    }
    // Baca: publik atau bertanda tangan
    if (req.method === "GET" && (m = p.match(/^\/storage\/v1\/object\/(?:public|sign-get)\/(.+)$/))) {
      const f = safe(m[1]);
      if (!f || !fs.existsSync(f)) return send(404, { error: "not found" });
      return send(200, fs.readFileSync(f), MIME[path.extname(f).slice(1)] ?? "application/octet-stream");
    }
    send(404, { error: "unsupported" });
  })
  .listen(PORT, () => console.log(`Fake storage jalan di http://localhost:${PORT} (folder ${ROOT})`));
