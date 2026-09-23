import { prisma } from "@/lib/prisma";
import { signedObjectUrl, CERT_BUCKET } from "@/lib/storage";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { reviewCertificate } from "./certificate-actions";

export default async function PendingCertificates() {
  const pending = await prisma.coachProfile.findMany({
    where: { certificateStatus: "PENDING" },
    select: { id: true, certificateUrl: true, certificationNote: true, user: { select: { name: true } } },
  });
  if (pending.length === 0) return null;

  const rows = await Promise.all(
    pending.map(async (p) => ({ ...p, viewUrl: p.certificateUrl ? await signedObjectUrl(CERT_BUCKET, p.certificateUrl) : null }))
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
                <p className="text-sm font-medium text-text">{r.user.name}</p>
                <p className="text-sm text-text-muted">{r.certificationNote}</p>
                {r.viewUrl ? (
                  <a href={r.viewUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-700 underline">
                    Lihat file sertifikat
                  </a>
                ) : (
                  <p className="text-sm text-warning-text">File tidak bisa dibuka (storage belum aktif).</p>
                )}
              </div>
              <div className="flex gap-2">
                <ConfirmSubmit
                  action={reviewCertificate.bind(null, r.id, true)}
                  label="Setujui"
                  title={`Setujui sertifikat ${r.user.name}?`}
                  description={`Badge "Bersertifikat" langsung tampil di profil coach ini untuk semua orang.`}
                  confirmLabel="Ya, setujui"
                />
                <ConfirmSubmit
                  action={reviewCertificate.bind(null, r.id, false)}
                  label="Tolak"
                  variant="danger"
                  title={`Tolak sertifikat ${r.user.name}?`}
                  description="Coach perlu mengunggah ulang sertifikatnya."
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
