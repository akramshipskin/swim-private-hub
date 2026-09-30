// Cadangan & pemulihan file di Supabase Storage (foto coach/kolam, sertifikat,
// tanda tangan). Backup database (workflow Backup DB) TIDAK memuat file-file
// ini. Lihat docs/backup.md.
//
//   node scripts/backup-storage.mjs backup  --out ./cadangan-storage
//   node scripts/backup-storage.mjs restore --from ./cadangan-storage
//
// Butuh env SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY. Restore memakai upsert
// (file yang sama ditimpa), jadi aman diulang. Di workflow, folder hasil backup
// dienkripsi dan diunggah ke penyimpanan S3 (backup-storage.yml).
import fs from "node:fs";
import path from "node:path";

const BUCKETS = ["coach-photos", "coach-certificates"];
const [mode, flag, dir] = process.argv.slice(2);
const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key || !["backup", "restore"].includes(mode) || !dir || !["--out", "--from"].includes(flag)) {
  console.error("Pemakaian: backup-storage.mjs backup --out <folder> | restore --from <folder> (env SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}
const auth = { Authorization: `Bearer ${key}`, apikey: key };
const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");

// Daftar semua berkas di bucket (rekursif; item tanpa id = folder).
async function listAll(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const res = await fetch(`${base}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`Gagal daftar ${bucket}/${prefix} (${res.status})`);
    const items = await res.json();
    for (const it of items) {
      const full = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null || it.id === undefined) files.push(...(await listAll(bucket, full)));
      else files.push(full);
    }
    if (items.length < 100) break;
  }
  return files;
}

if (mode === "backup") {
  const manifest = { createdAt: new Date().toISOString(), files: [] };
  for (const bucket of BUCKETS) {
    for (const file of await listAll(bucket)) {
      const res = await fetch(`${base}/storage/v1/object/${bucket}/${encodePath(file)}`, { headers: auth });
      if (!res.ok) throw new Error(`Gagal unduh ${bucket}/${file} (${res.status})`);
      const buf = Buffer.from(await res.arrayBuffer());
      const target = path.join(dir, bucket, ...file.split("/"));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, buf);
      manifest.files.push({ bucket, path: file, bytes: buf.length, type: res.headers.get("content-type") ?? "application/octet-stream" });
    }
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Backup selesai: ${manifest.files.length} berkas, ${manifest.files.reduce((n, f) => n + f.bytes, 0)} byte -> ${dir}`);
} else {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  let ok = 0;
  for (const f of manifest.files) {
    const buf = fs.readFileSync(path.join(dir, f.bucket, ...f.path.split("/")));
    if (buf.length !== f.bytes) throw new Error(`Ukuran ${f.bucket}/${f.path} beda dari manifest (rusak?)`);
    const res = await fetch(`${base}/storage/v1/object/${f.bucket}/${encodePath(f.path)}`, {
      method: "POST",
      headers: { ...auth, "content-type": f.type, "x-upsert": "true" },
      body: buf,
    });
    if (!res.ok) throw new Error(`Gagal pulihkan ${f.bucket}/${f.path} (${res.status})`);
    ok++;
  }
  console.log(`Pemulihan selesai: ${ok} berkas dikirim ke ${base}`);
}
