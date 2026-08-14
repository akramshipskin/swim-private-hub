"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CheckoutButton({
  templateId,
}: {
  templateId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/payment/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Gagal memulai pembayaran");
      return;
    }

    window.location.href = data.redirectUrl;
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={handleCheckout} loading={loading} className="w-full">
        Beli
      </Button>
      {error && <p className="text-xs text-danger-text">{error}</p>}
    </div>
  );
}
