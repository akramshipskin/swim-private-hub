// Validasi bentuk & panjang input API pendaftaran (publik, tanpa login).
// Sebelum ini body bukan-JSON atau nilai bukan-string bikin server 500, dan
// nama/alamat/bio tidak ada batas panjangnya (tes 30 Sep: nama 5000 huruf
// diterima dan tersimpan).

export const MAX_NAME = 100;
export const MAX_EMAIL = 254;
// bcrypt hanya memakai 72 byte pertama; lebih dari itu percuma dan cuma
// memperbesar beban server.
export const MAX_PASSWORD = 72;
export const MAX_POOL_NAME = 100;
export const MAX_ADDRESS = 300;
export const MAX_BIO = 1000;
export const MAX_NOTE = 500;

export const INVALID_BODY_ERROR = "Format permintaan tidak valid.";

// Body harus objek JSON. null = bukan JSON / bukan objek (null, array, angka).
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Pesan galat kalau ada field teks yang bukan string (mis. angka/objek), atau
// melebihi batas panjang. null = semua aman. Field yang tidak dikirim (undefined)
// dilewati; kewajiban isi tetap dicek pemanggil.
export function checkTextFields(body: Record<string, unknown>, limits: Record<string, { max: number; label: string }>): string | null {
  for (const [key, { max, label }] of Object.entries(limits)) {
    const v = body[key];
    if (v === undefined || v === null) continue;
    if (typeof v !== "string") return INVALID_BODY_ERROR;
    if (v.trim().length > max) return `${label} maksimal ${max} karakter.`;
  }
  return null;
}

// Daftar teks (keahlian, fasilitas): harus array of string kalau dikirim.
export function isStringArrayOrMissing(v: unknown): boolean {
  return v === undefined || v === null || (Array.isArray(v) && v.every((x) => typeof x === "string"));
}

// Cek bentuk saja (ada "@" dengan sesuatu di kiri dan kanan, tanpa spasi);
// bukan validasi RFC penuh.
export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
