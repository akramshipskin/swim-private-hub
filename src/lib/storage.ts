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
