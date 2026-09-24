import webpush from "web-push";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";

type Payload = { title: string; body: string; url?: string };

let vapidReady = false;

// Dimuat malas & aman: kalau env VAPID belum diisi, push dilewati diam-diam.
// Sebelumnya setVapidDetails jalan saat modul di-import, jadi env kosong bikin
// SEMUA route yang meng-import modul ini (termasuk webhook pembayaran) crash.
function ensureVapid() {
  if (vapidReady) return true;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

async function deliver(userIds: string[], payload: Payload) {
  if (!ensureVapid() || userIds.length === 0) return;

  // 1 query buat semua penerima (bukan 1 per orang) -- siaran ke banyak member
  // dulu jadi ratusan query.
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  // ponytail: dikirim serentak tanpa batas -- cukup buat ratusan penerima;
  // kalau sudah ribuan, pecah per 50 langganan.
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        // Subscription mati (device uninstall/expired) -- bersihin biar
        // gak nyoba kirim ke situ terus-terusan.
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}

// Dijadwalkan lewat after(): di serverless (Vercel) promise yang dilempar
// begitu saja bisa terputus saat fungsi selesai membalas, jadi push gak
// sampai. Di luar request (tes/skrip) after() melempar error -> jalan langsung.
async function schedule(userIds: string[], payload: Payload) {
  const job = () => deliver(userIds, payload).catch(() => {});
  try {
    after(job);
  } catch {
    await job();
  }
}

export async function sendPushToUser(userId: string, payload: Payload) {
  await schedule([userId], payload);
}

// Banyak penerima sekaligus, 1 jadwal after() dan 1 query langganan.
export async function sendPushToUsers(userIds: string[], payload: Payload) {
  await schedule(userIds, payload);
}

export async function sendPushToRole(role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", payload: Payload) {
  const users = await prisma.user.findMany({ where: { role, isActive: true }, select: { id: true } });
  await sendPushToUsers(users.map((u) => u.id), payload);
}
