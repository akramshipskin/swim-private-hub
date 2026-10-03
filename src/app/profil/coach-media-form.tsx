"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadCoachPhoto, uploadCoachCertificate, deleteCoachCertificate, uploadCoachSignature } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { certificateStatusBadge, MAX_CERTIFICATES_PER_COACH } from "@/lib/coach-certificates";

type Certificate = { id: string; name: string; status: keyof typeof certificateStatusBadge };

export default function CoachMediaForm({
  photoUrl,
  certificates,
  defaultCertificateName,
  signatureUrl,
  hasSignature,
  storageReady,
}: {
  photoUrl: string | null;
  certificates: Certificate[];
  // Nama sertifikat yang diisi saat daftar coach -- isian awal kalau belum
  // pernah mengunggah sertifikat.
  defaultCertificateName: string | null;
  // Signed URL gambar tanda tangan (null = belum diunggah / storage mati).
  signatureUrl: string | null;
  hasSignature: boolean;
  storageReady: boolean;
}) {
  const [photoState, photoAction, photoPending] = useActionState(uploadCoachPhoto, null);
  const [certState, certAction, certPending] = useActionState(uploadCoachCertificate, null);
  const [sigState, sigAction, sigPending] = useActionState(uploadCoachSignature, null);
  const certForm = useRef<HTMLFormElement>(null);
  const full = certificates.length >= MAX_CERTIFICATES_PER_COACH;

  // Kosongkan form setelah berhasil, siap untuk sertifikat berikutnya.
  useEffect(() => {
    if (certState?.success) certForm.current?.reset();
  }, [certState]);

  return (
    <div className="flex flex-col gap-6">
      {!storageReady && (
        <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
          Unggah file belum aktif. Hubungi admin.
        </p>
      )}
      <form action={photoAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Avatar src={photoUrl} alt="Foto profil" className="h-20 w-20" />
        <div className="flex flex-1 flex-col gap-2">
          <Field label="Foto profil (JPG/PNG/WEBP, maks 3MB)">
            <Input type="file" name="photo" accept="image/jpeg,image/png,image/webp" disabled={!storageReady} required />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={photoPending} disabled={!storageReady}>Unggah Foto</Button>
            {photoState?.error && <p role="alert" className="text-sm text-danger-text">{photoState.error}</p>}
            {photoState?.success && <p role="status" className="text-sm text-success-text">Foto tersimpan.</p>}
          </div>
        </div>
      </form>

      <form action={sigAction} className="flex flex-col gap-3 border-t border-border pt-5">
        <p className="text-sm font-medium text-text">Tanda tangan untuk sertifikat level peserta</p>
        <p className="text-sm text-text-muted">
          Foto tanda tanganmu di kertas putih (JPG/PNG, maks 3MB). Dipasang di sertifikat saat peserta menyelesaikan level
          bersamamu. {hasSignature ? "Unggah ulang untuk mengganti." : "Belum diunggah."}
        </p>
        {signatureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signatureUrl} alt="Tanda tangan tersimpan" className="h-16 w-auto self-start rounded border border-border bg-white p-1" />
        )}
        <Field label="File tanda tangan">
          <Input type="file" name="signature" accept="image/jpeg,image/png,image/webp" disabled={!storageReady} required />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={sigPending} disabled={!storageReady}>Simpan Tanda Tangan</Button>
          {sigState?.error && <p role="alert" className="text-sm text-danger-text">{sigState.error}</p>}
          {sigState?.success && <p role="status" className="text-sm text-success-text">Tanda tangan tersimpan.</p>}
        </div>
      </form>

      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <p className="text-sm font-medium text-text">Sertifikat renang/lifeguard</p>
        <p className="text-sm text-text-muted">
          Boleh lebih dari satu (maks {MAX_CERTIFICATES_PER_COACH}). Tiap sertifikat diperiksa admin; badge
          &quot;Bersertifikat&quot; tampil di profil setelah minimal satu disetujui.
        </p>

        {certificates.length === 0 ? (
          <p className="text-sm text-text-subtle">Belum ada sertifikat.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {certificates.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm text-text">{c.name}</span>
                  <Badge tone={certificateStatusBadge[c.status].tone}>{certificateStatusBadge[c.status].label}</Badge>
                </div>
                <ConfirmSubmit
                  action={deleteCoachCertificate.bind(null, c.id)}
                  label="Hapus"
                  variant="danger"
                  title={`Hapus sertifikat "${c.name}"?`}
                  description={
                    c.status === "APPROVED"
                      ? "Sertifikat ini sudah disetujui. Kalau ini satu-satunya yang disetujui, badge \"Bersertifikat\" di profilmu ikut hilang."
                      : "File sertifikat ini dihapus dan tidak bisa dikembalikan."
                  }
                  confirmLabel="Ya, hapus"
                />
              </li>
            ))}
          </ul>
        )}

        {full ? (
          <p className="text-sm text-text-muted">Sudah {MAX_CERTIFICATES_PER_COACH} sertifikat. Hapus salah satu untuk menambah yang baru.</p>
        ) : (
          <form ref={certForm} action={certAction} className="flex flex-col gap-3">
            <Field label="Nama sertifikat/lembaga">
              <Input
                name="certificateName"
                defaultValue={certificates.length === 0 ? defaultCertificateName ?? "" : ""}
                placeholder="Contoh: Sertifikasi Pelatih Renang FASI"
                maxLength={120}
                disabled={!storageReady}
                required
              />
            </Field>
            <Field label="File sertifikat (JPG/PNG/WEBP/PDF, maks 3MB)">
              <Input type="file" name="certificate" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!storageReady} required />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" loading={certPending} disabled={!storageReady}>Tambah Sertifikat</Button>
              {certState?.error && <p role="alert" className="text-sm text-danger-text">{certState.error}</p>}
              {certState?.success && <p role="status" className="text-sm text-success-text">Sertifikat terkirim, menunggu persetujuan.</p>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
