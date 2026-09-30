/* eslint-disable @typescript-eslint/no-require-imports -- berkas preload NODE_OPTIONS harus CommonJS */
// Uji LOKAL balasan AI chat: dimuat lewat NODE_OPTIONS="--require ./scripts/qa-ai-fake.cjs"
// bersama GEMINI_API_KEY=qa-fake. Panggilan ke Gemini/Anthropic TIDAK keluar ke
// internet: dibalas jawaban palsu berdasar isi pesan terakhir, dan isi
// permintaan (system prompt + riwayat) dicatat ke QA_AI_LOG supaya bisa
// diperiksa data apa yang dikirim ke AI.
//   pesan mengandung "refund" / "kacau" -> balasan berakhiran [ADMIN] (eskalasi)
//   pesan mengandung "error500"         -> HTTP 500 (AI gagal)
//   lainnya                             -> jawaban singkat biasa
const fs = require("node:fs");
const LOG = process.env.QA_AI_LOG || "/tmp/qa-ai.log";
const realFetch = globalThis.fetch;
globalThis.fetch = async function (input, init) {
  const url = typeof input === "string" ? input : input.url;
  const gemini = url.startsWith("https://generativelanguage.googleapis.com/");
  const claude = url.startsWith("https://api.anthropic.com/");
  if (!gemini && !claude) return realFetch.apply(this, arguments);
  const body = JSON.parse(init?.body ?? "{}");
  const turns = gemini ? body.contents.map((c) => c.parts[0].text) : body.messages.map((m) => m.content);
  const system = gemini ? body.systemInstruction?.parts?.[0]?.text : body.system;
  fs.appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), provider: gemini ? "gemini" : "claude", system, turns }) + "\n");
  const last = String(turns[turns.length - 1] ?? "").toLowerCase();
  if (last.includes("error500")) return new Response("fake upstream error", { status: 500 });
  const text = /refund|kacau/.test(last) ? "Soal ini perlu dicek admin ya. [ADMIN]" : "Paket dibeli per kolam dan hanya berlaku di kolam itu (jawaban AI palsu uji).";
  const payload = gemini ? { candidates: [{ content: { parts: [{ text }] } }] } : { content: [{ type: "text", text }] };
  return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
};
