"use client";

import { useState } from "react";
import { PendingApprovalScreen } from "@/components/pending-approval-screen";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PartnerSteps } from "@/components/partner-steps";
import { Field, Input, Textarea } from "@/components/ui/input";
import { POOL_FACILITIES } from "@/lib/pool-facilities";
import { isValidIndonesianPhone } from "@/lib/format";
import { TimeSelect } from "@/components/ui/time-select";
import { CitySelect } from "@/components/city-select";
import { PriceInput } from "@/components/ui/price-input";
import { partnerAgreementFor } from "@/lib/partner-agreement";

// Satu centang untuk S&K, Privasi, dan perjanjian kemitraan (bila sudah aktif).
const agreement = partnerAgreementFor("POOL_OWNER");

export default function RegisterPoolForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formRenderedAt] = useState(() => Date.now());
  const [website, setWebsite] = useState("");
  const [poolName, setPoolName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [dailyCapacity, setDailyCapacity] = useState("");
  const [openTime, setOpenTime] = useState("06:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [description, setDescription] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidIndonesianPhone(phone)) {
      setError("Format Nomor HP tidak valid (contoh: 0812xxxxxxx)");
      return;
    }
    if (closeTime <= openTime) {
      setError("Jam tutup harus setelah jam buka.");
      return;
    }

    const form = new FormData(e.currentTarget as HTMLFormElement);
    setLoading(true);

    const res = await fetch("/api/register-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName,
        phone,
        email: email || undefined,
        password,
        acceptedTerms: agreed,
        poolName,
        address,
        openTime,
        closeTime,
        description: description || undefined,
        facilities,
        city,
        pricePack4: form.get("pricePack4"),
        pricePack8: form.get("pricePack8"),
        dailyCapacity,
        website,
        formRenderedAt,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Pendaftaran gagal. Coba lagi.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) return <PendingApprovalScreen roleLabel="pemilik kolam" />;

  return (
    <AuthShell tagline="Kolammu jadi tempat les privat yang teratur." points={["Pasang harga tiket paketmu sendiri", "Bagian kolam masuk saldo setiap sesi Hadir", "Daftar gratis, tanpa biaya bulanan"]}>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Daftar Kolam</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Honeypot anti-spam -- pola sama kayak /register. */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="website">Jangan isi kolom ini</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <Field label="Nama Kolam">
              <Input value={poolName} onChange={(e) => setPoolName(e.target.value)} required />
            </Field>
            <Field label="Kota">
              <CitySelect value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="Alamat lengkap">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Jalan, nomor, kelurahan, kecamatan"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <TimeSelect name="openTime" label="Jam Buka" defaultValue={openTime} onChange={setOpenTime} />
              <TimeSelect name="closeTime" label="Jam Tutup" defaultValue={closeTime} onChange={setCloseTime} />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">Harga tiket paket</p>
              <p className="text-xs text-text-subtle">
                Tiket masuk untuk 1 coach + 1 peserta + 1 pendamping per sesi. Isi minimal satu, kelipatan Rp 1.000. Bisa diubah nanti.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Paket 4 sesi (Rp)">
                  <PriceInput name="pricePack4" />
                </Field>
                <Field label="Paket 8 sesi (Rp)">
                  <PriceInput name="pricePack8" />
                </Field>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Field label="Kapasitas harian untuk member SPH (sesi per hari)">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(e.target.value)}
                  required
                  placeholder="Contoh: 10"
                />
              </Field>
              <p className="text-xs text-text-subtle">
                Hitung dari keramaian harian kolam: berapa sesi les dari SPH yang masih bisa kolam terima per hari. 1 sesi = 1 coach + 1 peserta + 1 pendamping. Bisa diubah kapan saja.
              </p>
            </div>

            <Field label="Deskripsi kolam (opsional)">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Ukuran kolam, kedalaman, suasana, dll."
              />
            </Field>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">Fasilitas (opsional)</p>
              <div className="flex flex-wrap gap-2">
                {POOL_FACILITIES.map((f) => {
                  const active = facilities.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFacilities((prev) => (active ? prev.filter((x) => x !== f) : [...prev, f]))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium max-lg:min-h-[44px] ${active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-border bg-surface text-text-muted"}`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-border" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
              Akun pemilik kolam (untuk masuk)
            </p>

            <Field label="Nama Pemilik">
              <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required autoComplete="name" />
            </Field>
            <Field label="Nomor HP">
              <Input
                type="tel"
                placeholder="0812xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </Field>
            <Field label="Email (opsional)">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>

            <label className="flex items-start gap-2 text-xs text-text-muted max-lg:min-h-[44px] max-sm:py-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-700 focus:ring-brand-500 max-sm:h-5 max-sm:w-5"
              />
              <span>
                Saya setuju dengan{" "}
                <a href="/syarat-ketentuan" target="_blank" className="font-medium text-brand-700 hover:underline">
                  Syarat &amp; Ketentuan
                </a>{" "}
                dan{" "}
                <a href="/kebijakan-privasi" target="_blank" className="font-medium text-brand-700 hover:underline">
                  Kebijakan Privasi
                </a>
                {agreement && (
                  <>
                    , serta{" "}
                    <a href={agreement.href} target="_blank" className="font-medium text-brand-700 hover:underline">
                      {agreement.title}
                    </a>
                  </>
                )}
                .
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} disabled={!agreed} className="mt-1 w-full">
              Daftar
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Sudah punya akun?{" "}
            <a href="/login" className="font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
              Masuk
            </a>
          </p>
        </CardBody>
      </Card>
      <PartnerSteps kind="kolam" />
    </AuthShell>
  );
}
