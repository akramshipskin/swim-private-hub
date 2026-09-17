import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint, keys } = (await request.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Payload tidak lengkap" }, { status: 400 });
  }

  // P2002 = 2 request subscribe barengan buat endpoint yang sama, yang
  // satu udah kebikin duluan -- aman diabaikan (lihat affiliateCoach).
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  }).catch((err: { code?: string }) => {
    if (err?.code !== "P2002") throw err;
  });

  return Response.json({ ok: true });
}
