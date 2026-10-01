"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

// React 19 mengosongkan isian form setelah action selesai, termasuk waktu
// action ditolak. Hook ini mengirim form lewat onSubmit (tanpa reset otomatis)
// dan hanya mengosongkan form (dengan mengganti `key`) kalau hasilnya berhasil,
// jadi admin tidak perlu mengetik ulang setelah pesan penolakan
// (sweeping 2 Okt, no. 20). Pakai: <form key={key} onSubmit={onSubmit}>.
export function useKeepFormOnError(state: { error?: string } | null, formAction: (formData: FormData) => void) {
  const [key, setKey] = useState(0);
  const [, startTransition] = useTransition();
  const last = useRef(state);

  useEffect(() => {
    if (state && state !== last.current && !state.error) setKey((k) => k + 1);
    last.current = state;
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return { key, onSubmit };
}
