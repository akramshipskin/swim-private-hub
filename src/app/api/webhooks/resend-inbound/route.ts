import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { fetchReceivedEmail } from "@/lib/email";

// Resend ngirim webhook `email.received` cuma metadata (from/to/subject/
// email_id) -- body/html/headers HARUS ditarik lagi via
// emails.receiving.get(email_id) (dicek langsung dari
// node_modules/resend/dist/index.d.mts, bukan tebakan dokumentasi).
// Signature diverifikasi pake resend.webhooks.verify (svix di baliknya),
// throw kalau invalid -> 401.
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "RESEND_WEBHOOK_SECRET belum diisi" }, { status: 500 });
  }

  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Header signature tidak lengkap" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY ?? "dummy-key-for-verify");
  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      webhookSecret: secret,
    });
  } catch {
    return Response.json({ error: "Signature tidak valid" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return Response.json({ ok: true, ignored: event.type });
  }

  const { email_id: emailId, from, subject } = event.data;
  const full = await fetchReceivedEmail(emailId);

  const thread = await prisma.emailThread.upsert({
    where: { externalEmail: from },
    create: { externalEmail: from, subject: subject || "(tanpa subjek)", needsAdmin: true },
    update: { needsAdmin: true, subject: subject || "(tanpa subjek)" },
  });

  try {
    await prisma.emailMessage.create({
      data: {
        threadId: thread.id,
        direction: "INBOUND",
        fromAddress: from,
        toAddress: full.to[0] ?? "",
        subject: subject || "(tanpa subjek)",
        textBody: full.text ?? "",
        htmlBody: full.html,
        resendId: emailId,
      },
    });
  } catch (err: unknown) {
    // Resend bisa kirim ulang webhook yang sama (retry) -- resendId unique,
    // constraint violation di sini artinya emang duplikat, bukan error.
    const code = (err as { code?: string })?.code;
    if (code !== "P2002") throw err;
  }

  return Response.json({ ok: true });
}
