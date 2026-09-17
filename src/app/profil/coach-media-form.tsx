"use client";

import { useActionState } from "react";
import { uploadCoachPhoto, uploadCoachCertificate } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

const certStatus = {
  NONE: { label: "Belum ada sertifikat", tone: "neutral" },
  PENDING: { label: "Menunggu persetujuan admin", tone: "warning" },
  APPROVED: { label: "Disetujui", tone: "success" },
  REJECTED: { label: "Ditolak, silakan upload ulang", tone: "danger" },
} as const;

export default function CoachMediaForm({
  photoUrl,
  certificateStatus,
  certificationNote,
  storageReady,
}: {
  photoUrl: string | null;
  certificateStatus: keyof typeof certStatus;
  certificationNote: string | null;
  storageReady: boolean;
}) {
  const [photoState, photoAction, photoPending] = useActionState(uploadCoachPhoto, null);
  const [certState, certAction, certPending] = useActionState(uploadCoachCertificate, null);

  return (
    <div className="flex flex-col gap-6">
      {!storageReady && (
        <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
          Upload file belum aktif. Hubungi admin.
        </p>
      )}
      <form action={photoAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Avatar src={photoUrl} alt="Foto profil" className="h-20 w-20" />
        <div className="flex flex-1 flex-col gap-2">
          <Field label="Foto profil (JPG/PNG/WEBP, maks 3MB)">
            <Input type="file" name="photo" accept="image/jpeg,image/png,image/webp" disabled={!storageReady} required />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={photoPending} disabled={!storageReady}>Upload Foto</Button>
            {photoState?.error && <p role="alert" className="text-sm text-danger-text">{photoState.error}</p>}
            {photoState?.success && <p role="status" className="text-sm text-success-text">Foto tersimpan.</p>}
          </div>
        </div>
      </form>

      <form action={certAction} className="flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-text">Sertifikat renang/lifeguard</p>
          <Badge tone={certStatus[certificateStatus].tone}>{certStatus[certificateStatus].label}</Badge>
        </div>
        <p className="text-sm text-text-muted">
          Badge &quot;Bersertifikat&quot; tampil di profil setelah sertifikat disetujui admin. Upload ulang akan
          mengganti sertifikat lama dan menunggu persetujuan lagi.
        </p>
        <Field label="Nama sertifikat/lembaga">
          <Input name="certificationNote" defaultValue={certificationNote ?? ""} placeholder="Misal: Sertifikasi Pelatih Renang FASI" disabled={!storageReady} required />
        </Field>
        <Field label="File sertifikat (JPG/PNG/WEBP/PDF, maks 3MB)">
          <Input type="file" name="certificate" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!storageReady} required />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={certPending} disabled={!storageReady}>Kirim untuk Disetujui</Button>
          {certState?.error && <p role="alert" className="text-sm text-danger-text">{certState.error}</p>}
          {certState?.success && <p role="status" className="text-sm text-success-text">Sertifikat terkirim, menunggu persetujuan.</p>}
        </div>
      </form>
    </div>
  );
}
