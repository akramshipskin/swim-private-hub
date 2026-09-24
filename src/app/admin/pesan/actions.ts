"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MAX_CHAT_LENGTH } from "@/lib/chat-ai";
import { sendPushToUser } from "@/lib/push";

export type ReplyState = { error?: string } | null;

export async function replyToThread(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  await requireRole("ADMIN");
  const threadId = formData.get("threadId")?.toString() ?? "";
  const content = formData.get("content")?.toString().trim() ?? "";
  const resolve = formData.get("resolve") === "on";
  if (!content) return { error: "Balasan tidak boleh kosong." };
  if (content.length > MAX_CHAT_LENGTH) return { error: `Balasan maksimal ${MAX_CHAT_LENGTH} karakter.` };

  const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, select: { id: true, userId: true } });
  if (!thread) return { error: "Percakapan tidak ditemukan." };

  await prisma.$transaction([
    prisma.chatMessage.create({ data: { threadId, sender: "ADMIN", content } }),
    prisma.chatThread.update({ where: { id: threadId }, data: { needsAdmin: !resolve } }),
  ]);
  // Best-effort: gagal kirim notifikasi tidak boleh menggagalkan balasan yang
  // sudah tersimpan.
  await sendPushToUser(thread.userId, {
    title: "Balasan dari admin",
    body: content.length > 100 ? `${content.slice(0, 97)}...` : content,
    url: "/",
  }).catch(() => {});

  revalidatePath("/admin/pesan");
  return null;
}
