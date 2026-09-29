import { prisma } from "@/lib/prisma";
import { BentoCard } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { getOrCreateAffiliateCode } from "@/lib/affiliate";
import { AFFILIATE_COMMISSION_PERCENT, AFFILIATE_HOLD_DAYS } from "@/lib/policy";
import CopyLinkButton from "@/app/profil/copy-link-button";

const STATUS = {
  WAITING: { label: "Menunggu sesi Hadir pertama", tone: "neutral" },
  PENDING: { label: "Cair", tone: "warning" },
  RELEASED: { label: "Sudah masuk saldo", tone: "success" },
} as const;

// Kode afiliasi coach/kolam + riwayat komisinya (dashboard coach & kolam).
export async function AffiliateCard({
  owner,
  name,
  className,
}: {
  owner: { coachProfileId: string } | { poolId: string };
  name: string;
  className?: string;
}) {
  const code = await getOrCreateAffiliateCode(owner, name);
  const commissions = await prisma.affiliateCommission.findMany({
    where: owner,
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, amount: true, status: true, releaseAt: true, member: { select: { name: true } } },
  });
  const link = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.swimprivatehub.biz.id"}/register?ref=${code}`;

  return (
    <BentoCard title="Kode afiliasi" className={className}>
      <p className="text-sm text-text-muted">
        Member baru yang mendaftar dengan kode <b className="text-text">{code}</b> memberimu komisi{" "}
        {AFFILIATE_COMMISSION_PERCENT}% dari harga paket pertamanya, sekali per member. Komisi masuk saldo{" "}
        {AFFILIATE_HOLD_DAYS} hari setelah sesi pertamanya ditandai Hadir.
      </p>
      <CopyLinkButton link={link} id={`affiliate-link-${code}`} />
      {commissions.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {commissions.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="text-text">
                {c.member.name} · {formatRupiah(c.amount)}
              </span>
              <Badge tone={STATUS[c.status].tone}>
                {c.status === "PENDING" && c.releaseAt
                  ? `${STATUS.PENDING.label} ${c.releaseAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" })}`
                  : STATUS[c.status].label}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </BentoCard>
  );
}
