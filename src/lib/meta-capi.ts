import { createHash } from "node:crypto";
import { after } from "next/server";

// Pelacak iklan Meta dari server (Conversions API), Hadi 2 Okt (5A/5B: jalan
// tanpa menunggu persetujuan cookie; orang hukum setuju). Hanya peristiwa
// yang pasti terjadi di server: daftar akun member (CompleteRegistration) dan
// paket lunas (Purchase). Env kosong = tidak mengirim apa pun.
//   NEXT_PUBLIC_META_PIXEL_ID  ID Pixel (juga dipakai Pixel di browser)
//   META_CAPI_TOKEN            token Conversions API (rahasia, isi di Vercel)
//   META_TEST_EVENT_CODE       opsional, untuk uji di Events Manager

// Data browser yang disimpan saat checkout supaya Purchase dari notifikasi
// Midtrans (yang datang dari server Midtrans, bukan dari HP member) tetap
// bisa dicocokkan Meta. Sengaja tanpa alamat IP.
export type MetaTracking = { fbp?: string; fbc?: string; ua?: string };

type MetaUser = { phone?: string | null; email?: string | null; userId: string };

export type MetaEvent = {
  eventName: "CompleteRegistration" | "Purchase";
  // Sama dengan eventID di Pixel browser bila suatu saat dikirim dua-duanya
  // (Meta membuang duplikat). Purchase: order id; daftar: id user.
  eventId: string;
  user: MetaUser;
  tracking: MetaTracking & { ip?: string | null };
  sourceUrl: string;
  value?: number;
};

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

// Format yang diminta Meta sebelum di-hash: nomor HP dengan kode negara tanpa
// tanda + (0812… -> 62812…), email huruf kecil.
export function hashedUserData(user: MetaUser) {
  const digits = user.phone?.replace(/\D/g, "") ?? "";
  const phone = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return {
    ...(phone ? { ph: [sha256(phone)] } : {}),
    ...(user.email ? { em: [sha256(user.email.trim().toLowerCase())] } : {}),
    external_id: [sha256(user.userId)],
  };
}

function cookie(header: string | null, name: string) {
  const m = header?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!m) return undefined;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return undefined; // cookie rusak: abaikan, jangan gagalkan checkout/daftar
  }
}

// Cookie _fbp/_fbc dari Pixel browser + user agent. Nilai dipangkas supaya
// isi cookie/header yang aneh tidak tersimpan panjang.
export function trackingFromRequest(request: Request): MetaTracking {
  const h = request.headers;
  const cookies = h.get("cookie");
  const clip = (v?: string | null) => (v ? v.slice(0, 300) : undefined);
  return { fbp: clip(cookie(cookies, "_fbp")), fbc: clip(cookie(cookies, "_fbc")), ua: clip(h.get("user-agent")) };
}

export function buildPayload(e: MetaEvent, now = new Date()) {
  return {
    data: [
      {
        event_name: e.eventName,
        event_time: Math.floor(now.getTime() / 1000),
        event_id: e.eventId,
        action_source: "website",
        event_source_url: e.sourceUrl,
        user_data: {
          ...hashedUserData(e.user),
          ...(e.tracking.fbp ? { fbp: e.tracking.fbp } : {}),
          ...(e.tracking.fbc ? { fbc: e.tracking.fbc } : {}),
          ...(e.tracking.ua ? { client_user_agent: e.tracking.ua } : {}),
          ...(e.tracking.ip && e.tracking.ip !== "unknown" ? { client_ip_address: e.tracking.ip } : {}),
        },
        ...(e.value !== undefined ? { custom_data: { value: e.value, currency: "IDR" } } : {}),
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
}

// Pemanggil cek ini dulu sebelum query tambahan (data member untuk Purchase).
export function metaCapiEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_TOKEN);
}

export async function deliverMetaEvent(e: MetaEvent) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(e)),
      signal: AbortSignal.timeout(5000),
    });
    // Isi balasan Meta tidak berisi token; cukup kode + pesan untuk log.
    if (!res.ok) console.error(`[meta-capi] ${e.eventName} ${e.eventId} ditolak: ${res.status} ${(await res.text()).slice(0, 300)}`);
  } catch (err) {
    console.error(`[meta-capi] ${e.eventName} ${e.eventId} gagal: ${(err as Error)?.message ?? err}`);
  }
}

// Dijalankan setelah balasan terkirim (pola yang sama dengan push): pelacak
// iklan tidak boleh memperlambat atau menggagalkan daftar/pembayaran.
export async function sendMetaEvent(e: MetaEvent) {
  try {
    after(() => deliverMetaEvent(e));
  } catch {
    await deliverMetaEvent(e);
  }
}
