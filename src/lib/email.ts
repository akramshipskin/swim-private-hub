import { Resend } from "resend";

// Alamat pengirim tunggal buat inbox admin -- domain biz.id udah DKIM/SPF/MX
// verified (dicek manual Hadi lewat Resend dashboard), tapi RESEND_API_KEY
// masih harus diisi manual di .env sebelum kirim/terima beneran jalan.
export const INBOX_FROM_ADDRESS = "hello@swimprivatehub.biz.id";

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
  to: string;
  subject: string;
  text: string;
  inReplyToMessageId?: string | null;
}) {
  const { data, error } = await client().emails.send({
    from: INBOX_FROM_ADDRESS,
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
