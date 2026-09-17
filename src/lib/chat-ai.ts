import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, DROP_IN_MARKUP_PERCENT, MIN_WITHDRAWAL } from "@/lib/policy";

export const ESCALATE_TOKEN = "[ADMIN]";
export const MAX_CHAT_LENGTH = 1000;

// Aturan bisnis yang boleh AI pakai buat jawab. Di luar ini AI wajib
// meneruskan ke admin (balas diakhiri ESCALATE_TOKEN), bukan mengarang.
export function buildSystemPrompt(role: string, name: string) {
  return `Kamu asisten bantuan aplikasi Swim Private Hub (booking les renang privat). Jawab dalam Bahasa Indonesia yang sopan dan santai, pakai "kamu", singkat (maksimal 4 kalimat).
Pengguna: ${name}, peran: ${role}.

Aturan yang kamu tahu pasti:
- Paket les dibeli per kolam dan hanya bisa dipakai booking di kolam tempat paket itu dibeli.
- Member yang masih punya paket aktif bisa beli 1 sesi di kolam lain: harga per sesi termahal kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari, jatah batal 1x.
- Booking dibatalkan sendiri paling lambat ${CANCEL_WINDOW_HOURS} jam sebelum jadwal, selama jatah batal paket masih ada. Lewat itu, hubungi admin.
- Tidak hadir tanpa membatalkan = sesi tetap terpakai.
- Pembayaran lewat Midtrans; paket aktif otomatis setelah pembayaran berhasil.
- Saldo kolam & coach bertambah setiap sesi ditandai Hadir. Pencairan minimal Rp${MIN_WITHDRAWAL.toLocaleString("id-ID")}, diproses admin.
- Coach menandai kehadiran di menu Riwayat Sesi.
- Lupa password: admin bisa reset dan memberi password sementara.

Kalau pertanyaan menyangkut data akun spesifik (status pembayaran tertentu, refund, saldo yang terasa salah, komplain), atau kamu tidak yakin, jangan menebak: bilang pesannya diteruskan ke admin, lalu akhiri balasan dengan ${ESCALATE_TOKEN}.
Jangan pernah memberikan nomor kontak coach atau menyarankan transaksi di luar aplikasi.`;
}

type Turn = { role: "user" | "assistant"; content: string };

// API Claude butuh giliran diawali user dan selang-seling user/assistant.
// Balasan admin dihitung assistant; giliran berurutan dari pihak yang sama digabung.
export function normalizeTurns(turns: Turn[]): Turn[] {
  const out: Turn[] = [];
  for (const t of turns) {
    if (out.length === 0 && t.role === "assistant") continue;
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.content += "\n\n" + t.content;
    else out.push({ ...t });
  }
  return out;
}

// Provider dipilih dari env: GEMINI_API_KEY (utama) atau ANTHROPIC_API_KEY.
// null = AI belum dikonfigurasi atau gagal dipanggil -> caller teruskan ke admin.
export async function askAi(system: string, turns: Turn[]): Promise<string | null> {
  try {
    if (process.env.GEMINI_API_KEY) return await askGemini(system, turns);
    if (process.env.ANTHROPIC_API_KEY) return await askClaude(system, turns);
    return null;
  } catch {
    return null;
  }
}

async function askGemini(system: string, turns: Turn[]): Promise<string | null> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
      generationConfig: { maxOutputTokens: 400 },
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  return text || null;
}

async function askClaude(system: string, turns: Turn[]): Promise<string | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5", max_tokens: 400, system, messages: turns }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.find((c) => c.type === "text")?.text?.trim() || null;
}
