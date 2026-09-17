"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MAX_CHAT_LENGTH } from "@/lib/chat-ai";

export type ReplyState = { error?: string } | null;

export async function replyToThread(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  await requireRole("ADMIN");
  const threadId = formData.get("threadId")?.toString() ?? "";
  const content = formData.get("content")?.toString().trim() ?? "";
  const resolve = formData.get("resolve") === "on";
  if (!content) return { error: "Balasan tidak boleh kosong." };
  if (content.length > MAX_CHAT_LENGTH) return { error: `Balasan maksimal ${MAX_CHAT_LENGTH} karakter.` };

  const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, select: { id: true } });
  if (!thread) return { error: "Percakapan tidak ditemukan." };

  await prisma.$transaction([
    prisma.chatMessage.create({ data: { threadId, sender: "ADMIN", content } }),
    prisma.chatThread.update({ where: { id: threadId }, data: { needsAdmin: !resolve } }),
  ]);
  revalidatePath("/admin/pesan");
  return null;
}
