// Alamat langganan push yang dikirim browser harus berupa alamat layanan push
// resmi (Google/Firefox/Apple/Microsoft). Tanpa cek ini, pengguna login mana
// pun bisa mendaftarkan alamat sembarang (mis. alamat internal), lalu server
// mengirim permintaan ke sana saat ada notifikasi (SSRF buta). Ditambah 30 Sep.
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];

export const MAX_PUSH_FIELD = 1000;

export function isAllowedPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > MAX_PUSH_FIELD) return false;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.port !== "" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
}
