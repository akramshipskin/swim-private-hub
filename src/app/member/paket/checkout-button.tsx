"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

type Dependent = { id: string; name: string };

export default function CheckoutButton({
  templateId,
  dependents,
}: {
  templateId: string;
  dependents: Dependent[];
}) {
  const [dependentId, setDependentId] = useState(dependents[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!dependentId) {
      setError("Pilih peserta dulu");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/payment/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, dependentId }),
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
    <div className="flex w-full flex-col gap-2">
      <Select value={dependentId} onChange={(e) => setDependentId(e.target.value)} className="w-full">
        {dependents.map((d) => (
          <option key={d.id} value={d.id}>
            Buat {d.name}
          </option>
        ))}
      </Select>
      <Button onClick={handleCheckout} loading={loading} className="w-full">
        Beli
      </Button>
      {error && <p className="text-xs text-danger-text">{error}</p>}
    </div>
  );
}
