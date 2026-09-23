import { Resend } from "resend";

// Domain biz.id inbound = catch-all di Resend (dicek dari dokumentasi resmi:
// "You will receive emails sent to any address at your Resend domain" --
// gak perlu daftar tiap alamat satu-satu). Admin bisa terima di alamat
// apapun @swimprivatehub.biz.id (hello@, support@, dst); ini cuma fallback
// default kalau suatu saat perlu kirim TANPA thread yang jelas asalnya ke
// alamat mana (reply asli pakai alamat yang bener, lihat actions.ts).
export const INBOX_FROM_ADDRESS = "hello@swimprivatehub.biz.id";

// 4 alamat yang admin pilih waktu compose baru / buat tab filter inbox --
// domain-nya catch-all, jadi teknisnya alamat apapun @swimprivatehub.biz.id
// bisa dipakai, tapi dibatasin ke daftar ini biar gak asal ketik alamat baru.
export const INBOX_ADDRESSES = [
  "hello@swimprivatehub.biz.id",
  "support@swimprivatehub.biz.id",
  "info@swimprivatehub.biz.id",
  "billing@swimprivatehub.biz.id",
] as const;

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY belum diisi di .env");
  return new Resend(key);
}

export async function fetchReceivedEmail(emailId: string) {
  const { data, error } = await client().emails.receiving.get(emailId);
  if (error) throw new Error(`Resend gagal ambil email ${emailId}: ${error.message}`);
  if (!data) throw new Error(`Resend tidak mengembalikan data untuk email ${emailId}`);
  return data;
}

export async function sendReplyEmail(params: {
  from: string;
  to: string;
  subject: string;
  text: string;
  inReplyToMessageId?: string | null;
}) {
  const { data, error } = await client().emails.send({
    from: params.from,
    to: [params.to],
    subject: params.subject,
    text: params.text,
    headers: params.inReplyToMessageId
      ? { "In-Reply-To": params.inReplyToMessageId, References: params.inReplyToMessageId }
      : undefined,
  });
  if (error) throw new Error(`Resend gagal kirim email ke ${params.to}: ${error.message}`);
  if (!data) throw new Error(`Resend tidak mengembalikan id pengiriman ke ${params.to}`);
  return data;
}
