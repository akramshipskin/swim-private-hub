import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAllowedPushEndpoint, MAX_PUSH_FIELD } from "@/lib/push-endpoint";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Kamu belum masuk atau tidak punya akses ke fitur ini. Silakan masuk lagi." }, { status: 401 });
  }

  let body: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid. Muat ulang halaman, lalu coba lagi." }, { status: 400 });
  }
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const authKey = body?.keys?.auth;

  if (typeof p256dh !== "string" || typeof authKey !== "string" || !p256dh || !authKey || p256dh.length > MAX_PUSH_FIELD || authKey.length > MAX_PUSH_FIELD) {
    return Response.json({ error: "Data notifikasi tidak lengkap. Muat ulang halaman, lalu coba lagi." }, { status: 400 });
  }
  if (!isAllowedPushEndpoint(endpoint)) {
    return Response.json({ error: "Layanan notifikasi di browser ini tidak dikenali. Coba browser lain." }, { status: 400 });
  }

  // P2002 = 2 request subscribe barengan buat endpoint yang sama, yang
  // satu udah kebikin duluan -- aman diabaikan (lihat affiliateCoach).
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.user.id, p256dh, auth: authKey },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth: authKey,
    },
  }).catch((err: { code?: string }) => {
    if (err?.code !== "P2002") throw err;
  });

  return Response.json({ ok: true });
}
