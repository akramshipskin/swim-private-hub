import { prisma } from "@/lib/prisma";
import { signedObjectUrl, CERT_BUCKET } from "@/lib/storage";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { reviewCertificate } from "./certificate-actions";

export default async function PendingCertificates() {
  const pending = await prisma.coachCertificate.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, filePath: true, coachProfile: { select: { user: { select: { name: true } } } } },
  });
  if (pending.length === 0) return null;

  const rows = await Promise.all(
    pending.map(async (p) => ({
      id: p.id,
      name: p.name,
      coachName: p.coachProfile.user.name,
      viewUrl: p.filePath ? await signedObjectUrl(CERT_BUCKET, p.filePath) : null,
    }))
  );

  return (
    <Card className="mb-6 border-warning-text">
      <CardBody>
        <h2 className="mb-1 text-lg font-semibold text-text">Sertifikat coach menunggu persetujuan ({rows.length})</h2>
        <p className="mb-3 text-sm text-text-muted">Badge &quot;Bersertifikat&quot; baru tampil setelah disetujui.</p>
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text">{r.coachName}</p>
                <p className="text-sm text-text-muted">{r.name}</p>
                {r.viewUrl ? (
                  <a href={r.viewUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-700 underline">
                    Lihat file sertifikat
                  </a>
                ) : (
                  <p className="text-sm text-warning-text">File tidak bisa dibuka (storage belum aktif atau file hilang).</p>
                )}
              </div>
              <div className="flex gap-2">
                <ConfirmSubmit
                  action={reviewCertificate.bind(null, r.id, true)}
                  label="Setujui"
                  title={`Setujui sertifikat ${r.coachName}?`}
                  description={`"${r.name}" langsung tampil di profil coach ini untuk semua orang, dengan badge "Bersertifikat".`}
                  confirmLabel="Ya, setujui"
                />
                <ConfirmSubmit
                  action={reviewCertificate.bind(null, r.id, false)}
                  label="Tolak"
                  variant="danger"
                  title={`Tolak sertifikat ${r.coachName}?`}
                  description={`"${r.name}" ditolak. Coach bisa menghapusnya dan mengunggah ulang.`}
                  confirmLabel="Ya, tolak"
                />
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
