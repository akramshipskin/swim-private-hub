"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RequestCancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/booking/${bookingId}/cancel-request`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="secondary" loading={loading} onClick={handleRequest}>
        Ajukan Pembatalan ke Admin
      </Button>
      {error && <p className="max-w-[180px] text-right text-xs text-danger-text">{error}</p>}
    </div>
  );
}
