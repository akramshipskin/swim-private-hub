"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { INBOX_ADDRESSES, INBOX_FROM_ADDRESS, sendReplyEmail } from "@/lib/email";

export type ReplyState = { error?: string } | null;
const MAX_EMAIL_BODY_LENGTH = 4000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function replyToEmailThread(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  await requireRole("ADMIN");
  const threadId = formData.get("threadId")?.toString() ?? "";
  const content = formData.get("content")?.toString().trim() ?? "";
  const resolve = formData.get("resolve") === "on";
  if (!content) return { error: "Balasan tidak boleh kosong." };
  if (content.length > MAX_EMAIL_BODY_LENGTH) {
    return { error: `Balasan maksimal ${MAX_EMAIL_BODY_LENGTH} karakter.` };
  }

  const thread = await prisma.emailThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      externalEmail: true,
      subject: true,
      // Alamat kita yang dipakai balas = alamat yang TERAKHIR dipakai member
      // buat ngirim ke kita (hello@ atau support@ dst, domain catch-all) --
      // biar balesan gak selalu ngaku-ngaku dari hello@ walau yang ditanya
      // aslinya nulis ke support@.
      messages: {
        where: { direction: "INBOUND" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { resendId: true, toAddress: true },
      },
    },
  });
  if (!thread) return { error: "Thread tidak ditemukan." };

  const replySubject = thread.subject.startsWith("Re: ") ? thread.subject : `Re: ${thread.subject}`;
  const replyFrom = thread.messages[0]?.toAddress || INBOX_FROM_ADDRESS;

  let sent: { id: string };
  try {
    sent = await sendReplyEmail({
      from: replyFrom,
      to: thread.externalEmail,
      subject: replySubject,
      text: content,
      inReplyToMessageId: thread.messages[0]?.resendId ?? null,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal kirim email." };
  }

  await prisma.$transaction([
    prisma.emailMessage.create({
      data: {
        threadId: thread.id,
        direction: "OUTBOUND",
        fromAddress: replyFrom,
        toAddress: thread.externalEmail,
        subject: replySubject,
        textBody: content,
        resendId: sent.id,
      },
    }),
    prisma.emailThread.update({ where: { id: thread.id }, data: { needsAdmin: !resolve } }),
  ]);

  revalidatePath("/admin/email");
  return null;
}

export async function composeEmail(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  await requireRole("ADMIN");
  const to = formData.get("to")?.toString().trim() ?? "";
  const from = formData.get("from")?.toString().trim() ?? "";
  const subject = formData.get("subject")?.toString().trim() ?? "";
  const content = formData.get("content")?.toString().trim() ?? "";

  if (!EMAIL_PATTERN.test(to)) return { error: "Alamat tujuan tidak valid." };
  if (!INBOX_ADDRESSES.includes(from as (typeof INBOX_ADDRESSES)[number])) {
    return { error: "Alamat pengirim tidak dikenal." };
  }
  if (!subject) return { error: "Subjek tidak boleh kosong." };
  if (!content) return { error: "Isi email tidak boleh kosong." };
  if (content.length > MAX_EMAIL_BODY_LENGTH) {
    return { error: `Isi email maksimal ${MAX_EMAIL_BODY_LENGTH} karakter.` };
  }

  let sent: { id: string };
  try {
    sent = await sendReplyEmail({ from, to, subject, text: content });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal kirim email." };
  }

  const thread = await prisma.emailThread.upsert({
    where: { externalEmail: to },
    create: { externalEmail: to, subject, needsAdmin: false },
    update: {},
  });
  await prisma.emailMessage.create({
    data: {
      threadId: thread.id,
      direction: "OUTBOUND",
      fromAddress: from,
      toAddress: to,
      subject,
      textBody: content,
      resendId: sent.id,
    },
  });

  revalidatePath("/admin/email");
  redirect(`/admin/email?t=${thread.id}`);
}
