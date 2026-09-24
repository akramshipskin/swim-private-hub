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

    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, dependentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Gagal memulai pembayaran. Coba lagi.");
        setLoading(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      // Koneksi putus: jangan biarkan tombol berputar terus.
      setError("Koneksi terputus. Periksa internet, lalu coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Select aria-label="Paket ini untuk peserta" value={dependentId} onChange={(e) => setDependentId(e.target.value)} className="w-full">
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
