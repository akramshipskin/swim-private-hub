import { isPendingApproval } from "@/lib/pending-approval";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { UserActions } from "../user-display";
import { formatRupiah } from "@/lib/format";
import { formatDateLabel, formatTimeWib, todayWibDateString, wibDateTime } from "@/lib/datetime";
import { coachBioLine } from "@/lib/coach-bio";
import { roleLabel } from "@/lib/nav-links";
import { deletionImpact } from "@/lib/account-deletion";
import AnonymizeCard from "./anonymize-card";
import ResetTotpButton from "./reset-totp-button";

export const metadata = { title: "Detail User | Swim Private Hub" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-text">{value}</span>
    </div>
  );
}

function shortDate(d: Date | null) {
  return d
    ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
    : "-";
}

// Halaman detail 1 user buat admin: semua yang perlu diketahui tentang orang
// ini dalam 1 layar, per peran (Hadi 18 Sep). Tombol aksi (reset password,
// nonaktifkan, hubungi) tetap sama dengan yang ada di daftar user.
export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await requireRole("ADMIN");
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      dependents: { where: { isActive: true }, orderBy: { name: "asc" } },
      packages: { orderBy: { createdAt: "desc" }, include: { dependent: true, pool: { select: { name: true } } } },
      coachProfile: true,
      poolAffiliations: { select: { pool: { select: { id: true, name: true } } }, orderBy: { pool: { name: "asc" } } },
      poolOwnerships: { select: { pool: { select: { id: true, name: true, walletBalance: true, isActive: true, address: true } } } },
    },
  });
  if (!user) notFound();
  const deletion = user.deletionRequestedAt && !user.anonymizedAt ? await deletionImpact(user.id) : null;

  const startMonth = wibDateTime(`${todayWibDateString().slice(0, 7)}-01`, "00:00");
  const [bookings, payments, withdrawals, coachSessions, coachManual] = await Promise.all([
    user.role === "MEMBER"
      ? prisma.booking.findMany({
          where: { memberId: user.id },
          orderBy: { availability: { startTime: "desc" } },
          take: 5,
          include: {
            availability: { include: { coach: { select: { name: true } }, pool: { select: { name: true } } } },
            package: { include: { dependent: true } },
          },
        })
      : Promise.resolve([]),
    user.role === "MEMBER"
      ? prisma.payment.aggregate({
          where: { status: "SUCCESS", package: { memberId: user.id } },
          _sum: { amount: true },
          _count: true,
        })
      : Promise.resolve(null),
    prisma.withdrawalRequest.findMany({
      where: user.role === "COACH" ? { coachProfile: { userId: user.id } } : { pool: { ownerships: { some: { ownerId: user.id } } } },
      orderBy: { requestedAt: "desc" },
      take: 5,
    }),
    user.role === "COACH"
      ? prisma.booking.findMany({
          where: { availability: { coachId: user.id, startTime: { gte: startMonth } } },
          select: { attended: true, status: true },
        })
      : Promise.resolve([]),
    // Koreksi manual saldo coach (baris tanpa sesi, dicatat langsung di
    // database): ikut di saldo tapi tidak berasal dari sesi mana pun.
    user.role === "COACH" && user.coachProfile
      ? prisma.walletTransaction.aggregate({
          where: { coachProfileId: user.coachProfile.id, type: "SESSION_PAYOUT", bookingId: null },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
  ]);
  const manualAmount = coachManual?._sum.amount ?? 0;

  const activePackages = user.packages.filter((p) => p.status === "ACTIVE" && p.sisaSesi > 0);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <Link href="/admin/users" className="text-sm font-medium text-brand-700 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
        ← Kembali ke Kelola User
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.role === "COACH" && <Avatar src={user.coachProfile?.photoUrl} className="h-16 w-16" />}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text">{user.name}</h1>
            <p className="text-sm text-text-muted">
              {roleLabel[user.role] ?? user.role}
              {user.role === "COACH" && coachBioLine(user.coachProfile) ? ` · ${coachBioLine(user.coachProfile)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.anonymizedAt ? (
            <Badge tone="neutral">Akun dihapus</Badge>
          ) : (
            isPendingApproval(user) ? (
              <Badge tone="warning">Menunggu persetujuan</Badge>
            ) : (
              <Badge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? "Aktif" : "Nonaktif"}</Badge>
            )
          )}
          {/* Akun yang sudah dihapus tidak punya HP/email untuk masuk -- tombol
              aktifkan/reset password tidak ada gunanya dan membingungkan. */}
          {!user.anonymizedAt && <UserActions user={user} isSelf={user.id === session.user.id} />}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {deletion && user.deletionRequestedAt && (
          <AnonymizeCard
            userId={user.id}
            requestedAt={user.deletionRequestedAt.toISOString()}
            upcomingBookings={deletion.upcomingBookings}
            remainingSessions={deletion.remainingSessions}
          />
        )}
        <Card>
          <CardBody>
            <h2 className="mb-2 text-lg font-semibold text-text">Data akun</h2>
            <Row label="No HP" value={user.phone ?? "-"} />
            <Row label="Email" value={user.email ?? "-"} />
            <Row label="Terdaftar" value={shortDate(user.createdAt)} />
            <Row label="Wajib ganti password" value={user.mustChangePassword ? "Ya" : "Tidak"} />
            {/* Reset 2FA hanya untuk coach/member/pemilik kolam; 2FA admin
                direset lewat scripts/reset-admin-2fa.mts. */}
            <Row
              label="2FA (Google Authenticator)"
              value={
                <span className="inline-flex flex-wrap items-center justify-end gap-2">
                  {user.totpEnabledAt ? "Aktif" : "Tidak aktif"}
                  {user.role !== "ADMIN" && (user.totpEnabledAt || user.totpSecret) && !user.anonymizedAt && (
                    <ResetTotpButton userId={user.id} userName={user.name} />
                  )}
                </span>
              }
            />
            {user.registeredReferer && <Row label="Sumber pendaftaran" value={user.registeredReferer} />}
          </CardBody>
        </Card>

        {user.role === "COACH" && user.coachProfile && (
          <Card>
            <CardBody>
              <h2 className="mb-2 text-lg font-semibold text-text">Profil coach</h2>
              <Row label="Umur & jenis kelamin" value={coachBioLine(user.coachProfile) ?? "Belum diisi"} />
              <Row label="Keahlian" value={user.coachProfile.specialties.join(", ") || "Belum diisi"} />
              <Row
                label="Sertifikat"
                value={
                  user.coachProfile.certificateStatus === "APPROVED"
                    ? `Disetujui${user.coachProfile.certificationNote ? ` · ${user.coachProfile.certificationNote}` : ""}`
                    : user.coachProfile.certificateStatus === "PENDING"
                      ? "Menunggu persetujuan"
                      : user.coachProfile.certificateStatus === "REJECTED"
                        ? "Ditolak"
                        : "Belum ada"
                }
              />
              <Row label="Saldo" value={formatRupiah(user.coachProfile.walletBalance)} />
              {manualAmount !== 0 && (
                <Row label="Termasuk koreksi manual (tanpa sesi)" value={`${manualAmount < 0 ? "−" : ""}${formatRupiah(Math.abs(manualAmount))}`} />
              )}
              <Row
                label="Sesi bulan ini"
                value={`${coachSessions.filter((b) => b.attended === true).length} hadir · ${coachSessions.filter((b) => b.status === "BOOKED" && b.attended === null).length} terjadwal`}
              />
              <Row
                label="Rekening"
                value={
                  // Disamarkan (keputusan Hadi 25 Sep): nomor lengkap hanya di
                  // halaman proses pencairan, tempat admin benar-benar transfer.
                  user.coachProfile.bankAccountNumber
                    ? `${user.coachProfile.bankName ?? "-"} · •••• ${user.coachProfile.bankAccountNumber.slice(-4)} a.n. ${user.coachProfile.bankAccountName ?? "-"}`
                    : "Belum diisi"
                }
              />
              {user.coachProfile.bio && <p className="mt-3 text-sm text-text-muted">{user.coachProfile.bio}</p>}
              <Link
                href={`/pelatih/${user.id}`}
                className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center"
              >
                Lihat profil publik →
              </Link>
            </CardBody>
          </Card>
        )}

        {user.role === "COACH" && (
          <Card>
            <CardBody>
              <h2 className="mb-2 text-lg font-semibold text-text">Mengajar di kolam</h2>
              {user.poolAffiliations.length === 0 ? (
                <p className="text-sm text-text-muted">Belum terafiliasi ke kolam mana pun.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {user.poolAffiliations.map((a) => (
                    <li key={a.pool.id}>
                      <Badge tone="brand">{a.pool.name}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}

        {user.role === "POOL_OWNER" && (
          <Card>
            <CardBody>
              <h2 className="mb-2 text-lg font-semibold text-text">Kolam yang dikelola</h2>
              {user.poolOwnerships.length === 0 ? (
                <p className="text-sm text-text-muted">Belum memegang kolam.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {user.poolOwnerships.map(({ pool }) => (
                    <li key={pool.id} className="rounded-xl bg-surface-muted p-3">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
                        {pool.name}
                        <Badge tone={pool.isActive ? "success" : "warning"}>{pool.isActive ? "Aktif" : "Nonaktif"}</Badge>
                      </p>
                      <p className="text-sm text-text-muted">{pool.address ?? "Alamat belum diisi"}</p>
                      <p className="text-sm text-text">Saldo kolam: {formatRupiah(pool.walletBalance)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}

        {user.role === "MEMBER" && (
          <Card>
            <CardBody>
              <h2 className="mb-2 text-lg font-semibold text-text">Peserta & paket</h2>
              {user.dependents.length === 0 ? (
                <p className="text-sm text-text-muted">Belum ada peserta terdaftar.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {user.dependents.map((d) => {
                    const pkgs = activePackages.filter((p) => p.dependentId === d.id);
                    return (
                      <li key={d.id} className="rounded-xl bg-surface-muted p-3">
                        <p className="text-sm font-semibold text-text">{d.isSelf ? `${user.name} (diri sendiri)` : d.name}</p>
                        {pkgs.length === 0 ? (
                          <p className="text-sm text-text-subtle">Belum ada paket aktif.</p>
                        ) : (
                          pkgs.map((p) => (
                            <p key={p.id} className="text-sm text-text-muted">
                              {p.pool?.name ?? "Kolam tidak diketahui"} · {p.name} · sisa {p.sisaSesi}/{p.totalSesi} sesi · jatah batal{" "}
                              {p.jatahCancel}x{p.expiredDate ? ` · s.d. ${shortDate(p.expiredDate)}` : ""}
                            </p>
                          ))
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {payments && (
                <p className="mt-3 text-sm text-text-muted">
                  Total pembayaran berhasil: <span className="font-semibold text-text">{formatRupiah(payments._sum.amount ?? 0)}</span>{" "}
                  ({payments._count} transaksi)
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {user.role === "MEMBER" && (
          <Card>
            <CardBody>
              <h2 className="mb-2 text-lg font-semibold text-text">5 booking terakhir</h2>
              {bookings.length === 0 ? (
                <p className="text-sm text-text-muted">Belum pernah booking.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {bookings.map((b) => (
                    <li key={b.id} className="text-sm">
                      <span className="font-medium text-text">
                        {formatDateLabel(b.availability.date)} {formatTimeWib(b.availability.startTime)}
                      </span>{" "}
                      <span className="text-text-muted">
                        · {b.availability.pool.name} · coach {b.availability.coach.name} · peserta{" "}
                        {b.package.dependent.isSelf ? user.name : b.package.dependent.name}
                      </span>{" "}
                      <Badge tone={b.status === "CANCELLED" ? "neutral" : b.attended ? "success" : "brand"}>
                        {b.status === "CANCELLED" ? "Dibatalkan" : b.attended === true ? "Hadir" : b.attended === false ? "Tidak hadir" : "Terjadwal"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}

        {(user.role === "COACH" || user.role === "POOL_OWNER") && (
          <Card>
            <CardBody>
              <h2 className="mb-2 text-lg font-semibold text-text">Pencairan terakhir</h2>
              {withdrawals.length === 0 ? (
                <p className="text-sm text-text-muted">Belum pernah mengajukan pencairan.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {withdrawals.map((w) => (
                    <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-text-muted">{shortDate(w.requestedAt)}</span>
                      <span className="font-medium text-text">{formatRupiah(w.amount)}</span>
                      <Badge tone={w.status === "PAID" ? "success" : w.status === "FAILED" ? "danger" : "warning"}>
                        {w.status === "PAID" ? "Sudah ditransfer" : w.status === "FAILED" ? "Gagal / ditolak" : "Menunggu"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </main>
  );
}
