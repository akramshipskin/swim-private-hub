import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let endpoint: unknown;
  try {
    endpoint = ((await request.json()) as { endpoint?: unknown })?.endpoint;
  } catch {
    return Response.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }
  if (typeof endpoint !== "string" || !endpoint) {
    return Response.json({ error: "endpoint wajib diisi" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return Response.json({ ok: true });
}
