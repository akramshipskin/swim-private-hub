import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Kamu belum masuk atau tidak punya akses ke fitur ini. Silakan masuk lagi." }, { status: 401 });
  }

  let endpoint: unknown;
  try {
    endpoint = ((await request.json()) as { endpoint?: unknown })?.endpoint;
  } catch {
    return Response.json({ error: "Permintaan tidak valid. Muat ulang halaman, lalu coba lagi." }, { status: 400 });
  }
  if (typeof endpoint !== "string" || !endpoint) {
    return Response.json({ error: "Data notifikasi tidak lengkap. Muat ulang halaman, lalu coba lagi." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return Response.json({ ok: true });
}
