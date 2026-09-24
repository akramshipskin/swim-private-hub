// Supabase Storage lewat REST API (tanpa SDK). Butuh env SUPABASE_URL &
// SUPABASE_SERVICE_ROLE_KEY, plus 2 bucket: "coach-photos" (public) dan
// "coach-certificates" (private, dibuka lewat signed URL).
export const PHOTO_BUCKET = "coach-photos";
export const CERT_BUCKET = "coach-certificates";
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const CERT_TYPES: Record<string, string> = { ...PHOTO_TYPES, "application/pdf": "pdf" };

export function isStorageConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function headers(extra: Record<string, string> = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { Authorization: `Bearer ${key}`, apikey: key, ...extra };
}

// Balikin pesan error (string) atau null kalau file valid.
export function validateUpload(file: File | null, kind: "photo" | "certificate"): string | null {
  if (!file || file.size === 0) return "Pilih file dulu.";
  const types = kind === "photo" ? PHOTO_TYPES : CERT_TYPES;
  if (!types[file.type]) return kind === "photo" ? "Foto harus JPG, PNG, atau WEBP." : "Sertifikat harus JPG, PNG, WEBP, atau PDF.";
  if (file.size > MAX_UPLOAD_BYTES) return "Ukuran file maksimal 3MB.";
  return null;
}

// Label jenis file (file.type) dikirim browser dan bisa dipalsukan -- cek juga
// "tanda tangan" di byte awal isi file (sweep keamanan 25 Sep).
export async function hasMatchingSignature(file: File): Promise<boolean> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  switch (file.type) {
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b[0] === 0x89 && ascii(1, 4) === "PNG";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "application/pdf":
      return ascii(0, 4) === "%PDF";
    default:
      return false;
  }
}

export const SIGNATURE_MISMATCH_ERROR = "Isi file tidak cocok dengan jenisnya. Unggah ulang foto/dokumen aslinya.";

export function extensionFor(file: File) {
  return CERT_TYPES[file.type];
}

export async function uploadObject(bucket: string, path: string, file: File) {
  const res = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: headers({ "content-type": file.type, "x-upsert": "true" }),
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new Error(`Upload gagal (${res.status})`);
}

export function publicObjectUrl(bucket: string, path: string) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function signedObjectUrl(bucket: string, path: string, expiresIn = 600): Promise<string | null> {
  if (!isStorageConfigured()) return null;
  const res = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/sign/${bucket}/${path}`, {
    method: "POST",
    headers: headers({ "content-type": "application/json" }),
    body: JSON.stringify({ expiresIn }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { signedURL?: string };
  return data.signedURL ? `${process.env.SUPABASE_URL}/storage/v1${data.signedURL}` : null;
}
