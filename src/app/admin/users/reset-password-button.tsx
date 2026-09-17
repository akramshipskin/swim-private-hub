"use client";

import { useState } from "react";
import { resetUserPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildWaLinkTo } from "@/lib/whatsapp";

export default function ResetPasswordButton({
  userId,
  userName,
  phone,
  loginId,
}: {
  userId: string;
  userName: string;
  phone: string | null;
  loginId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setLoading(true);
    const res = await resetUserPassword(userId);
    setLoading(false);
    setOpen(false);
    if (res.error) setError(res.error);
    else setTempPassword(res.tempPassword ?? null);
  }

  const waMessage = tempPassword
    ? `Halo ${userName}, password akun Swim Private Hub kamu udah direset admin.\n\nLogin: ${loginId}\nPassword sementara: ${tempPassword}\n\nPas login kamu bakal diminta bikin password baru.`
    : "";

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Reset password
      </Button>
      <ConfirmDialog
        open={open}
        title={`Reset password ${userName}?`}
        description="Password lamanya langsung gak berlaku. Kamu dapet password sementara buat dikirim ke dia, dan dia wajib bikin password baru pas login."
        confirmLabel="Ya, reset"
        loading={loading}
        onConfirm={handleReset}
        onCancel={() => setOpen(false)}
      />
      {(tempPassword || error) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`reset-result-${userId}`}
        >
          <div className="w-full max-w-sm rounded-xl bg-surface p-5 text-left shadow-lg">
            <h2 id={`reset-result-${userId}`} className="text-base font-semibold text-text">
              {error ? "Gagal reset password" : "Password direset"}
            </h2>
            {error ? (
              <p className="mt-1.5 text-sm text-danger-text">{error}</p>
            ) : (
              <>
                <p className="mt-1.5 text-sm text-text-muted">
                  Password sementara {userName} (cuma ditampilin sekali ini):
                </p>
                <p className="mt-2 select-all rounded-md bg-surface-muted px-3 py-2 font-mono text-base tracking-wide text-text">
                  {tempPassword}
                </p>
              </>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {tempPassword && phone && (
                <a
                  href={buildWaLinkTo(phone, waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-whatsapp px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Kirim via WA
                </a>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTempPassword(null);
                  setError(null);
                }}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
