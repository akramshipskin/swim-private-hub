import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/nav-links";
import { askAi, buildSystemPrompt, normalizeTurns, ESCALATE_TOKEN, MAX_CHAT_LENGTH } from "@/lib/chat-ai";

async function currentUser() {
  const session = await auth();
  if (!session || session.user.role === "ADMIN") return null;
  return session.user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const thread = await prisma.chatThread.findUnique({
    where: { userId: user.id },
    select: { messages: { orderBy: { createdAt: "asc" }, take: 100, select: { id: true, sender: true, content: true, createdAt: true } } },
  });
  return Response.json({ messages: thread?.messages ?? [] });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = (await request.json().catch(() => ({}))) as { content?: string };
  const text = content?.trim() ?? "";
  if (!text) return Response.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
  if (text.length > MAX_CHAT_LENGTH) {
    return Response.json({ error: `Pesan maksimal ${MAX_CHAT_LENGTH} karakter.` }, { status: 400 });
  }

  const thread = await prisma.chatThread.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // Batas wajar biar biaya AI gak bisa dihabisin 1 akun: 20 pesan per jam.
  const recent = await prisma.chatMessage.count({
    where: { threadId: thread.id, sender: "USER", createdAt: { gte: new Date(Date.now() - 3_600_000) } },
  });
  if (recent >= 20) {
    return Response.json({ error: "Terlalu banyak pesan dalam 1 jam. Coba lagi nanti." }, { status: 429 });
  }

  await prisma.chatMessage.create({ data: { threadId: thread.id, sender: "USER", content: text } });

  const history = await prisma.chatMessage.findMany({
    where: { threadId: thread.id, sender: { in: ["USER", "AI", "ADMIN"] } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { sender: true, content: true },
  });
  const turns = normalizeTurns(
    history.reverse().map((m) => ({ role: m.sender === "USER" ? "user" : "assistant", content: m.content }))
  );

  const aiReply = await askAi(buildSystemPrompt(roleLabel[user.role] ?? user.role, user.name ?? ""), turns);

  if (aiReply === null) {
    await prisma.$transaction([
      prisma.chatMessage.create({
        data: { threadId: thread.id, sender: "SYSTEM", content: "Pesanmu sudah diteruskan ke admin. Balasan akan muncul di sini." },
      }),
      prisma.chatThread.update({ where: { id: thread.id }, data: { needsAdmin: true } }),
    ]);
  } else {
    const escalate = aiReply.includes(ESCALATE_TOKEN);
    await prisma.$transaction([
      prisma.chatMessage.create({
        data: { threadId: thread.id, sender: "AI", content: aiReply.replace(ESCALATE_TOKEN, "").trim() },
      }),
      prisma.chatThread.update({ where: { id: thread.id }, data: escalate ? { needsAdmin: true } : { updatedAt: new Date() } }),
    ]);
  }

  return GET();
}
