// Hadi 9 Okt: coach tidak boleh membawa member keluar dari SPH, jadi teks
// bebas yang dibaca member (bio coach, catatan perkembangan, keterampilan
// tambahan) tidak boleh memuat kontak pribadi. Penyaring ini menangkap nomor
// HP, tautan WhatsApp/Telegram/Line, dan email. Batasnya: nomor yang ditulis
// dengan kata ("nol delapan satu...") atau dipecah dengan huruf tidak
// tertangkap; itu ditangani lewat Perjanjian Coach pasal 6 dan pemeriksaan admin.
const PHONE_ID = /(?<!\d)(?:\+?62|0)[\s.\-]?8(?:[\s.\-]?\d){7,12}(?!\d)/;
const LONG_DIGITS = /\d(?:[\s.\-]?\d){9,}/;
const CHAT_LINK = /(?:wa\.me|whatsapp\.com|t\.me|telegram\.me|line\.me)\b/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export const PERSONAL_CONTACT_ERROR =
  "Jangan menulis nomor HP, email, atau tautan chat pribadi di sini. Semua komunikasi dengan member lewat aplikasi.";

export function hasPersonalContact(text: string | null | undefined): boolean {
  if (!text) return false;
  return PHONE_ID.test(text) || LONG_DIGITS.test(text) || CHAT_LINK.test(text) || EMAIL.test(text);
}
