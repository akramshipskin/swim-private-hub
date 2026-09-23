import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReplyForm from "./reply-form";
import ComposeForm from "./compose-form";
import { INBOX_ADDRESSES } from "@/lib/email";

function time(d: Date) {
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

const BOX_TABS = ["Semua", ...INBOX_ADDRESSES] as const;

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
          messages: {
            orderBy: { createdAt: "asc" },
            select: { id: true, direction: true, textBody: true, fromAddress: true, createdAt: true },
          },
        },
      })
    : null;
  const waiting = threads.filter((th) => th.needsAdmin).length;

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
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <ul className="flex flex-col gap-2">
            {filteredThreads.map((th) => {
              const last = th.messages[0];
              return (
                <li key={th.id}>
                  <Link
                    href={`/admin/email?t=${th.id}${activeBox !== "Semua" ? `&box=${activeBox}` : ""}`}
                    className={`block rounded-xl border px-3 py-2.5 ${th.id === selectedId ? "border-brand-500 bg-brand-50" : "border-border bg-surface hover:bg-surface-muted"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-text">{th.externalEmail}</p>
                      {th.needsAdmin && <Badge tone="warning">Perlu dibalas</Badge>}
                    </div>
                    <p className="text-xs text-text-subtle">
                      {th.subject} · {time(th.updatedAt)}
                      {th.ourAddress && <> · <span className="text-text-muted">ke {th.ourAddress}</span></>}
                    </p>
                    <p className="mt-1 truncate text-xs text-text-muted">{last?.textBody}</p>
                  </Link>
                </li>
              );
            })}
          </ul>

          {selected && (
            <Card>
              <CardBody className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-text">{selected.externalEmail}</p>
                  <p className="text-sm text-text-muted">{selected.subject}</p>
                </div>
                <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
                  {selected.messages.map((m) => (
                    <div key={m.id} className={m.direction === "INBOUND" ? "self-start" : "self-end text-right"}>
                      <p className="text-[11px] text-text-subtle">{m.direction === "INBOUND" ? m.fromAddress : `Admin (${m.fromAddress})`} · {time(m.createdAt)}</p>
                      <p className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-left text-sm whitespace-pre-wrap ${m.direction === "INBOUND" ? "bg-surface-muted text-text" : "bg-brand-50 text-text"}`}>
                        {m.textBody}
                      </p>
                    </div>
                  ))}
                </div>
                <ReplyForm threadId={selected.id} />
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
