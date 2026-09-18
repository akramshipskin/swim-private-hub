"use client";

import { useActionState } from "react";
import { deletePoolPhoto, uploadPoolPhoto } from "@/lib/pool-info-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

// Foto fasilitas kolam. Terpisah dari form info kolam supaya upload tidak
// ikut pola "Edit dulu baru Simpan" (upload sekali klik, langsung tampil).
export function PoolPhotosForm({
  poolId,
  photos,
  storageReady,
}: {
  poolId: string;
  photos: string[];
  storageReady: boolean;
}) {
  const [uploadState, uploadAction, uploading] = useActionState(uploadPoolPhoto, null);
  const [deleteState, deleteAction, deleting] = useActionState(deletePoolPhoto, null);
  const error = uploadState?.error ?? deleteState?.error;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Foto kolam dan fasilitasnya. Tampil di halaman booking member, profil coach, dan landing page. Foto pertama
        dipakai sebagai sampul. Maksimal 6 foto.
      </p>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url, i) => (
            <li key={`${url}-${i}`} className="overflow-hidden rounded-xl border border-border bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto kolam ${i + 1}`} className="h-28 w-full object-cover" />
              <form action={deleteAction} className="flex items-center justify-between gap-2 px-2 py-1.5">
                <input type="hidden" name="poolId" value={poolId} />
                <input type="hidden" name="url" value={url} />
                <span className="text-xs text-text-subtle">{i === 0 ? "Sampul" : `Foto ${i + 1}`}</span>
                <Button type="submit" variant="ghost" size="sm" loading={deleting} className="text-danger-text">
                  Hapus
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={uploadAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="poolId" value={poolId} />
        <Field label="Tambah foto (JPG/PNG/WEBP, maks 3MB)" className="flex-1">
          <Input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required disabled={!storageReady} />
        </Field>
        <Button type="submit" loading={uploading} disabled={!storageReady}>
          Upload Foto
        </Button>
      </form>

      {!storageReady && <p className="text-sm text-warning-text">Upload file belum aktif. Hubungi admin.</p>}
      {error && (
        <p role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
