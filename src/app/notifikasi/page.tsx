import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NavBar } from "@/components/nav-bar";
import { prisma } from "@/lib/prisma";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";
import { buttonClass } from "@/components/ui/button";
import { formatFullTimeWib, formatRelativeTime, listNotifications, notificationGate, safeInternalUrl } from "@/lib/notifications";
import { NotificationList, type NotificationItem } from "./notification-list";

export const metadata: Metadata = {
  title: "Notifikasi | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function NotifikasiPage() {
  const session = await auth();
  const gate = notificationGate(session);
  if ("redirectTo" in gate) redirect(gate.redirectTo);
  const user = session!.user;

  let items: NotificationItem[] | null = null;
  let avatarUrl: string | null | undefined;
  try {
    const [rows, coachProfile] = await Promise.all([
      listNotifications(gate.userId),
      user.role === "COACH"
        ? prisma.coachProfile.findUnique({ where: { userId: gate.userId }, select: { photoUrl: true } })
        : null,
    ]);
    avatarUrl = user.role === "COACH" ? (coachProfile?.photoUrl ?? null) : undefined;
    const now = new Date();
    items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      hasUrl: safeInternalUrl(r.url) !== null,
      unread: r.readAt === null,
      timeLabel: formatRelativeTime(r.createdAt, now),
      timeFull: formatFullTimeWib(r.createdAt),
      iso: r.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error(`[notifikasi] gagal memuat daftar: ${(err as Error)?.message ?? "error"}`);
  }

  return (
    <NavBar
      userName={user.name ?? ""}
      userRole={roleLabel[user.role] ?? user.role}
      links={roleNavLinks[user.role]}
      avatarUrl={avatarUrl}
    >
      <main className="w-full px-4 py-6 sm:py-8">
        <div className="max-w-3xl">
          {items === null ? (
            <>
              <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Notifikasi</h1>
              <div role="alert" className="rounded-3xl border border-border bg-surface p-6 text-center">
                <p className="text-sm text-text">Notifikasi gagal dimuat. Periksa koneksi, lalu coba lagi.</p>
                <Link href="/notifikasi" className={buttonClass({ variant: "secondary", className: "mt-4" })}>
                  Coba lagi
                </Link>
              </div>
            </>
          ) : (
            <NotificationList items={items} />
          )}
        </div>
      </main>
    </NavBar>
  );
}
