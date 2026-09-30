/* eslint-disable @typescript-eslint/no-require-imports -- berkas preload NODE_OPTIONS harus CommonJS */
// Uji LOKAL notifikasi push: dimuat lewat NODE_OPTIONS="--require ./scripts/qa-push-intercept.cjs"
// pada server dev. Kiriman web-push ke fcm.googleapis.com TIDAK keluar ke
// internet: ditangkap, dibalas 201, dan isinya didekripsi dengan kunci
// pelanggan uji (dibuat scripts/qa-push-seed.mts) lalu dicatat ke berkas log.
// Jadi terbukti: siapa yang menerima, judul, isi, dan bahwa tanda tangan VAPID
// terpasang. Tidak ada dampak di production (hanya aktif kalau dimuat manual).
const https = require("node:https");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { EventEmitter } = require("node:events");
const { Readable } = require("node:stream");

const KEYS_FILE = process.env.QA_PUSH_KEYS || "/tmp/qa-push-keys.json";
const LOG_FILE = process.env.QA_PUSH_LOG || "/tmp/qa-push.log";
const b64u = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const hkdf = (ikm, salt, info, len) => Buffer.from(crypto.hkdfSync("sha256", ikm, salt, info, len));

// RFC 8291 (aes128gcm): kembalikan teks pesan.
function decrypt(body, sub) {
  const salt = body.subarray(0, 16);
  const idlen = body[20];
  const senderPub = body.subarray(21, 21 + idlen);
  const cipher = body.subarray(21 + idlen);
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.setPrivateKey(b64u(sub.priv));
  const uaPub = b64u(sub.pub);
  const secret = ecdh.computeSecret(senderPub);
  const ikm = hkdf(secret, b64u(sub.auth), Buffer.concat([Buffer.from("WebPush: info\0"), uaPub, senderPub]), 32);
  const cek = hkdf(ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdf(ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12);
  const d = crypto.createDecipheriv("aes-128-gcm", cek, nonce);
  d.setAuthTag(cipher.subarray(cipher.length - 16));
  const plain = Buffer.concat([d.update(cipher.subarray(0, cipher.length - 16)), d.final()]);
  let end = plain.length;
  while (end > 0 && plain[end - 1] === 0) end--;
  return plain.subarray(0, end - 1).toString("utf8"); // buang penanda 0x02
}

const original = https.request;
console.log(`[qa-push] penangkap aktif di proses ${process.pid}`);
https.request = function (options, cb) {
  const host = typeof options === "string" ? new URL(options).hostname : options.hostname || options.host || "";
  if (host !== "fcm.googleapis.com") return original.apply(this, arguments);
  console.log(`[qa-push] menangkap ${options.path}`);

  const req = new EventEmitter();
  const chunks = [];
  req.write = (c) => (chunks.push(Buffer.from(c)), true);
  req.setTimeout = () => req;
  req.destroy = () => {};
  req.end = (c) => {
    if (c) chunks.push(Buffer.from(c));
    setImmediate(() => {
      const entry = { t: new Date().toISOString(), path: options.path, vapid: /^vapid /i.test(options.headers?.Authorization || options.headers?.authorization || "") };
      try {
        const subs = JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
        const sub = subs[options.path];
        if (!sub) entry.error = "langganan uji tidak dikenal";
        else Object.assign(entry, { user: sub.user, message: JSON.parse(decrypt(Buffer.concat(chunks), sub)) });
      } catch (e) {
        entry.error = String(e.message || e);
      }
      fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
      const res = new Readable({ read() {} });
      res.statusCode = 201;
      res.headers = {};
      if (cb) cb(res);
      res.push(null);
    });
  };
  return req;
};
