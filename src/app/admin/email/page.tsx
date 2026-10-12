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

const PAGE = 50;

export default async function AdminEmailPage({ searchParams }: { searchParams: Promise<{ t?: string; box?: string; q?: string; n?: string }> }) {
  await requireRole("ADMIN");
  const { t, box, q: rawQ, n } = await searchParams;
  const activeBox = box && (INBOX_ADDRESSES as readonly string[]).includes(box) ? box : "Semua";
  const q = (rawQ ?? "").trim().slice(0, 100);
  // Ratusan percakapan: tampil 50 dulu, tombol "Tampilkan Lebih Banyak" menambah 50.
  const limit = Math.min(Math.max(Number(n) || PAGE, PAGE), 1000);
  const search = q
    ? { OR: [{ externalEmail: { contains: q, mode: "insensitive" as const } }, { subject: { contains: q, mode: "insensitive" as const } }] }
    : {};

  const [threads, totalThreads, waitingThreads] = await Promise.all([
    prisma.emailThread.findMany({
      where: search,
      orderBy: [{ needsAdmin: "desc" }, { updatedAt: "desc" }],
      take: limit,
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
    }),
    prisma.emailThread.count({ where: search }),
    // Hitungan "menunggu dibalas" dari SEMUA percakapan, bukan hanya yang tampil.
    prisma.emailThread.findMany({
      where: { needsAdmin: true },
      select: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { direction: true, fromAddress: true, toAddress: true } } },
    }),
  ]);

  const withOurAddress = threads.map((th) => {
    const last = th.messages[0];
    const ourAddress = last && (last.direction === "INBOUND" ? last.toAddress : last.fromAddress);
    return { ...th, ourAddress };
  });
  const waitingAddress = waitingThreads.map((th) => {
    const last = th.messages[0];
    return last && (last.direction === "INBOUND" ? last.toAddress : last.fromAddress);
  });
  const boxCounts = Object.fromEntries(INBOX_ADDRESSES.map((addr) => [addr, waitingAddress.filter((a) => a === addr).length]));
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
  const waiting = waitingThreads.length;
  const listQuery = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (activeBox !== "Semua") p.set("box", activeBox);
    if (q) p.set("q", q);
    if (limit > PAGE) p.set("n", String(limit));
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v); else p.delete(k);
    const s = p.toString();
    return `/admin/email${s ? `?${s}` : ""}`;
  };
  const older = selected ? selected.messages.slice(1) : [];
  const selectedOurAddress = selected ? withOurAddress.find((th) => th.id === selected.id)?.ourAddress : undefined;

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      {/* Di HP saat membaca satu email: judul halaman, Tulis Email Baru, dan tab
          disembunyikan supaya isi email langsung terlihat di atas (seperti Gmail). */}
      <div className={t ? "max-lg:hidden" : ""}>
        <h1 className="text-2xl font-semibold tracking-tight text-text">Email</h1>
        <p className="mt-1 text-sm text-text-muted">
          Inbox <b>@swimprivatehub.biz.id</b>. {waiting > 0 ? `${waiting} email menunggu dibalas.` : "Tidak ada yang menunggu."}
        </p>

        <div className="mt-4">
          <ComposeForm />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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

        <form action="/admin/email" className="mt-3 mb-6 flex gap-2">
          {activeBox !== "Semua" && <input type="hidden" name="box" value={activeBox} />}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Cari pengirim atau judul email"
            aria-label="Cari email"
            className="min-h-[44px] w-full max-w-md rounded-xl border border-border bg-surface px-3 text-sm text-text placeholder:text-text-subtle"
          />
          <button type="submit" className="min-h-[44px] shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white">
            Cari
          </button>
        </form>
      </div>

      {filteredThreads.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-text-muted">{q ? `Tidak ada email yang cocok dengan "${q}".` : "Belum ada email masuk."}</CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          {/* Di HP: daftar saja, atau isi email saja (seperti Gmail). Di layar lebar: berdampingan. */}
          <div className={`${t ? "max-lg:hidden" : ""} h-fit`}>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {filteredThreads.map((th) => {
              const last = th.messages[0];
              const sender = parseSender(th.externalEmail);
              const unread = th.needsAdmin;
              return (
                <li key={th.id}>
                  <Link
                    href={listQuery({ t: th.id })}
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
          <p className="mt-3 text-center text-xs text-text-subtle">
            {filteredThreads.length < threads.length || activeBox !== "Semua" ? `${filteredThreads.length} percakapan di kotak ini` : `${threads.length} dari ${totalThreads} percakapan`}
          </p>
          {threads.length < totalThreads && (
            <Link href={listQuery({ n: String(limit + PAGE), t: undefined })} scroll={false} className="mt-2 flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-surface text-sm font-medium text-text hover:bg-surface-muted">
              Tampilkan Lebih Banyak
            </Link>
          )}
          </div>

          {selected && (
            <section className={`${t ? "" : "max-lg:hidden"} min-w-0`}>
              <Link href={listQuery({ t: undefined })} className="mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-brand-700 lg:hidden">
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
                      className="inline-flex min-h-[44px] items-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted lg:min-h-0 lg:py-1.5"
                    >
                      ↩ Balas
                    </a>
                  </div>

                  {/* Terbaru di atas dan terbuka penuh, kotak balas tepat di bawahnya;
                      pesan lama dilipat di bawah kotak balas. */}
                  {[selected.messages[0], ...older].map((m, i) => {
                    if (!m) return null;
                    const inbound = m.direction === "INBOUND";
                    const sender = inbound ? parseSender(m.fromAddress) : { name: "Admin", email: m.fromAddress };
                    const card = (
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
                    if (i > 0) return card;
                    return (
                      <div key={m.id} className="flex flex-col gap-3">
                        {card}
                        <ReplyForm threadId={selected.id} to={selected.externalEmail} />
                        {older.length > 0 && <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-subtle">Pesan sebelumnya ({older.length})</p>}
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
