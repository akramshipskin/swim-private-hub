"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { INBOX_FROM_ADDRESS, sendReplyEmail } from "@/lib/email";

export type ReplyState = { error?: string } | null;
const MAX_EMAIL_BODY_LENGTH = 4000;

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
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { resendId: true } },
    },
  });
  if (!thread) return { error: "Thread tidak ditemukan." };

  const replySubject = thread.subject.startsWith("Re: ") ? thread.subject : `Re: ${thread.subject}`;

  let sent: { id: string };
  try {
    sent = await sendReplyEmail({
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
        fromAddress: INBOX_FROM_ADDRESS,
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
