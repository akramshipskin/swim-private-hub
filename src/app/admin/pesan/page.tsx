import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/nav-links";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReplyForm from "./reply-form";
import { checkAiStatus } from "@/lib/chat-ai";

const senderLabel = { USER: "Pengguna", AI: "Asisten AI", ADMIN: "Admin", SYSTEM: "Sistem" } as const;

function time(d: Date) {
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

export const metadata = { title: "Pesan | Swim Private Hub" };

const PAGE = 50;

export default async function AdminPesanPage({ searchParams }: { searchParams: Promise<{ t?: string; q?: string; n?: string }> }) {
  await requireRole("ADMIN");
  const { t, q: rawQ, n } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 100);
  const limit = Math.min(Math.max(Number(n) || PAGE, PAGE), 1000);
  const where = q ? { user: { name: { contains: q, mode: "insensitive" as const } } } : {};
  const listHref = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (limit > PAGE) p.set("n", String(limit));
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v); else p.delete(k);
    const s = p.toString();
    return `/admin/pesan${s ? `?${s}` : ""}`;
  };
  const [totalThreads, waiting] = await Promise.all([
    prisma.chatThread.count({ where }),
    prisma.chatThread.count({ where: { needsAdmin: true } }),
  ]);

  const threads = await prisma.chatThread.findMany({
    where,
    orderBy: [{ needsAdmin: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      needsAdmin: true,
      updatedAt: true,
      user: { select: { name: true, role: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } },
    },
  });
  const selectedId = t ?? threads[0]?.id;
  const selected = selectedId
    ? await prisma.chatThread.findUnique({
        where: { id: selectedId },
        select: {
          id: true,
          needsAdmin: true,
          user: { select: { name: true, role: true, phone: true, email: true } },
          messages: { orderBy: { createdAt: "asc" }, select: { id: true, sender: true, content: true, createdAt: true } },
        },
      })
    : null;
  const ai = await checkAiStatus();

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      {/* Di HP saat membaca satu percakapan: bagian atas disembunyikan supaya chat langsung terlihat. */}
      <div className={t ? "max-lg:hidden" : ""}>
      <h1 className="text-2xl font-semibold tracking-tight text-text">Pesan</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Chat bantuan dari member, coach, dan pemilik kolam. Yang tidak bisa dijawab asisten AI ditandai{" "}
        <b>Perlu dibalas</b>. {waiting > 0 ? `${waiting} percakapan menunggu.` : "Tidak ada yang menunggu."}
      </p>

      <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${ai.ok ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text"}`}>
        Asisten AI: <b>{ai.provider}</b>: {ai.detail}
      </p>

      <form action="/admin/pesan" className="mb-4 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Cari nama pengirim"
          aria-label="Cari percakapan"
          className="min-h-[44px] w-full max-w-md rounded-xl border border-border bg-surface px-3 text-sm text-text placeholder:text-text-subtle"
        />
        <button type="submit" className="min-h-[44px] shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white">
          Cari
        </button>
      </form>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-text-muted">{q ? `Tidak ada percakapan dari "${q}".` : "Belum ada percakapan."}</CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className={t ? "max-lg:hidden" : ""}>
          <ul className="flex flex-col gap-2">
            {threads.map((th) => (
              <li key={th.id}>
                <Link
                  href={listHref({ t: th.id })}
                  className={`block rounded-xl border px-3 py-2.5 ${th.id === selectedId ? "border-brand-500 bg-brand-50" : "border-border bg-surface hover:bg-surface-muted"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-text">{th.user.name}</p>
                    {th.needsAdmin && <Badge tone="warning">Perlu dibalas</Badge>}
                  </div>
                  <p className="text-xs text-text-subtle">{roleLabel[th.user.role]} · {time(th.updatedAt)}</p>
                  <p className="mt-1 truncate text-xs text-text-muted">{th.messages[0]?.content}</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-xs text-text-subtle">{threads.length} dari {totalThreads} percakapan</p>
          {threads.length < totalThreads && (
            <Link href={listHref({ n: String(limit + PAGE), t: undefined })} scroll={false} className="mt-2 flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-surface text-sm font-medium text-text hover:bg-surface-muted">
              Tampilkan Lebih Banyak
            </Link>
          )}
          </div>

          {selected && (
            <div className={t ? "" : "max-lg:hidden"}>
            <Link href={listHref({ t: undefined })} className="mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-brand-700 lg:hidden">
              ← Semua Percakapan
            </Link>
            <Card>
              <CardBody className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-semibold text-text">{selected.user.name}</p>
                  <p className="text-sm text-text-muted">
                    {roleLabel[selected.user.role]} · {selected.user.phone ?? selected.user.email ?? "-"}
                  </p>
                </div>
                {/* Urutan dibalik + flex-col-reverse: kotak chat langsung terbuka di
                    pesan terbaru (bawah), tanpa perlu digulir dulu. */}
                <div className="flex max-h-[28rem] flex-col-reverse gap-2 overflow-y-auto">
                  {[...selected.messages].reverse().map((m) => (
                    <div key={m.id} className={m.sender === "USER" ? "self-start" : "self-end text-right"}>
                      <p className="text-xs text-text-subtle">{senderLabel[m.sender]} · {time(m.createdAt)}</p>
                      <p className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-left text-sm whitespace-pre-wrap ${m.sender === "USER" ? "bg-surface-muted text-text" : "bg-brand-50 text-text"}`}>
                        {m.content}
                      </p>
                    </div>
                  ))}
                </div>
                <ReplyForm threadId={selected.id} />
              </CardBody>
            </Card>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
