"use client";

import { useEffect, useRef, useState } from "react";

// Pola "Edit dulu baru Simpan" buat data sensitif (komisi, rekening):
// field terkunci sampai klik Edit, balik terkunci setelah simpan sukses,
// dan Batal me-reset isian (formKey dipasang sebagai key <form>).
// Simpan di-disable sesaat setelah Edit biar klik ganda gak langsung submit.
export function useEditLock(pending: boolean, error: string | undefined) {
  const [isEditing, setIsEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [justEntered, setJustEntered] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !error) setIsEditing(false);
    wasPending.current = pending;
  }, [pending, error]);

  return {
    locked: !isEditing,
    formKey,
    saveDisabled: justEntered,
    startEdit() {
      setIsEditing(true);
      setJustEntered(true);
      setTimeout(() => setJustEntered(false), 400);
    },
    cancel() {
      setIsEditing(false);
      setFormKey((k) => k + 1);
    },
  };
}
