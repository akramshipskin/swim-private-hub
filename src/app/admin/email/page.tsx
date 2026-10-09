import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReplyForm from "./reply-form";
import ComposeForm from "./compose-form";
import MessageCard from "./message-card";
import { INBOX_ADDRESSES } from "@/lib/email";
import { emailSrcDoc, parseSender, senderInitial, shortTime, snippet } from "@/lib/email-view";

function time(d: Date) {
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

const BOX_TABS = ["Semua", ...INBOX_ADDRESSES] as const;

export const metadata = { title: "Email | Swim Private Hub" };

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "sm" }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700 ${size === "md" ? "h-10 w-10 text-base" : "h-8 w-8 text-sm"}`}
    >
      {senderInitial(name)}
    </span>
  );
}

export default async function AdminEmailPage({ searchParams }: { searchParams: Promise<{ t?: string; box?: string }> }) {
  await requireRole("ADMIN");
  const { t, box } = await searchParams;
  const activeBox = box && (INBOX_ADDRESSES as readonly string[]).includes(box) ? box : "Semua";

  const threads = await prisma.emailThread.findMany({
    orderBy: [{ needsAdmin: "desc" }, { updatedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      externalEmail: true,
      subject: true,
      needsAdmin: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { textBody: true, direction: true, fromAddress: true, toAddress: true },
      },
    },
  });

  const withOurAddress = threads.map((th) => {
    const last = th.messages[0];
    const ourAddress = last && (last.direction === "INBOUND" ? last.toAddress : last.fromAddress);
    return { ...th, ourAddress };
  });
  const boxCounts = Object.fromEntries(
    INBOX_ADDRESSES.map((addr) => [addr, withOurAddress.filter((th) => th.ourAddress === addr && th.needsAdmin).length])
  );
  const filteredThreads = activeBox === "Semua" ? withOurAddress : withOurAddress.filter((th) => th.ourAddress === activeBox);

  const selectedId = t ?? filteredThreads[0]?.id;
  const selected = selectedId
    ? await prisma.emailThread.findUnique({
        where: { id: selectedId },
        select: {
          id: true,
          externalEmail: true,
          subject: true,
          needsAdmin: true,
          messages: {
            // Terbaru di atas supaya percakapan panjang tidak perlu digulir jauh.
            orderBy: { createdAt: "desc" },
            select: { id: true, direction: true, textBody: true, fromAddress: true, toAddress: true, createdAt: true },
          },
        },
      })
    : null;
  // Hanya pesan terbaru yang dikirim lengkap (termasuk isi HTML); pesan lama
  // dilipat dan diambil saat dibuka.
  const newest = selected?.messages[0];
  const newestHtml =
    newest && newest.direction === "INBOUND"
      ? (await prisma.emailMessage.findUnique({ where: { id: newest.id }, select: { htmlBody: true } }))?.htmlBody
      : null;
  const waiting = threads.filter((th) => th.needsAdmin).length;
  const boxQuery = activeBox !== "Semua" ? `&box=${activeBox}` : "";
  const selectedOurAddress = selected ? withOurAddress.find((th) => th.id === selected.id)?.ourAddress : undefined;

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Email</h1>
      <p className="mt-1 text-sm text-text-muted">
        Inbox <b>@swimprivatehub.biz.id</b>. {waiting > 0 ? `${waiting} email menunggu dibalas.` : "Tidak ada yang menunggu."}
      </p>

      <div className="mt-4">
        <ComposeForm />
      </div>

      <div className="mt-4 mb-6 flex flex-wrap gap-2">
        {BOX_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "Semua" ? "/admin/email" : `/admin/email?box=${tab}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium max-lg:min-h-[44px] ${
              activeBox === tab ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border bg-surface text-text-muted hover:bg-surface-muted"
            }`}
          >
            {tab === "Semua" ? "Semua" : tab.split("@")[0]}
            {tab !== "Semua" && boxCounts[tab] > 0 && <Badge tone="warning">{boxCounts[tab]}</Badge>}
          </Link>
        ))}
      </div>

      {filteredThreads.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-text-muted">Belum ada email masuk.</CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          {/* Di HP: daftar saja, atau isi email saja (seperti Gmail). Di layar lebar: berdampingan. */}
          <ul className={`${t ? "max-lg:hidden" : ""} h-fit divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface`}>
            {filteredThreads.map((th) => {
              const last = th.messages[0];
              const sender = parseSender(th.externalEmail);
              const unread = th.needsAdmin;
              return (
                <li key={th.id}>
                  <Link
                    href={`/admin/email?t=${th.id}${boxQuery}`}
                    className={`flex gap-3 px-3 py-3 ${th.id === selectedId ? "bg-brand-50" : "hover:bg-surface-muted"}`}
                  >
                    <Avatar name={sender.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${unread ? "font-semibold text-text" : "font-medium text-text-muted"}`}>{sender.name}</p>
                        <span className={`shrink-0 text-xs ${unread ? "font-semibold text-text" : "text-text-subtle"}`}>{shortTime(th.updatedAt)}</span>
                      </div>
                      <p className={`truncate text-sm ${unread ? "font-semibold text-text" : "text-text-muted"}`}>{th.subject}</p>
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs text-text-subtle">{snippet(last?.textBody)}</p>
                        {unread && <Badge tone="warning">Perlu dibalas</Badge>}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {selected && (
            <section className={`${t ? "" : "max-lg:hidden"} min-w-0`}>
              <Link href={`/admin/email${activeBox !== "Semua" ? `?box=${activeBox}` : ""}`} className="mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-brand-700 lg:hidden">
                ← Kotak Masuk
              </Link>
              <Card>
                <CardBody className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold leading-snug text-text">{selected.subject}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {selectedOurAddress && <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-text-muted">ke {selectedOurAddress}</span>}
                        {selected.needsAdmin && <Badge tone="warning">Perlu dibalas</Badge>}
                      </div>
                    </div>
                    <a
                      href="#balas"
                      className="inline-flex min-h-[44px] items-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted lg:min-h-0 lg:py-1.5"
                    >
                      ↩ Balas
                    </a>
                  </div>

                  <div className="flex flex-col gap-3">
                    {selected.messages.map((m, i) => {
                      const inbound = m.direction === "INBOUND";
                      const sender = inbound ? parseSender(m.fromAddress) : { name: "Admin", email: m.fromAddress };
                      return (
                        <MessageCard
                          key={m.id}
                          id={m.id}
                          inbound={inbound}
                          name={sender.name}
                          email={sender.email}
                          to={m.toAddress}
                          iso={m.createdAt.toISOString()}
                          timeLabel={time(m.createdAt)}
                          snippet={snippet(m.textBody)}
                          initialBody={i === 0 ? { text: m.textBody, srcDoc: newestHtml ? emailSrcDoc(newestHtml) : null } : null}
                        />
                      );
                    })}
                  </div>

                  <ReplyForm threadId={selected.id} to={selected.externalEmail} />
                </CardBody>
              </Card>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
