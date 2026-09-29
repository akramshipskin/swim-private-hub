"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveMilestoneUpdate, addMilestoneItem } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea, Input } from "@/components/ui/input";

type Item = { id: string; text: string; level: number };
export type ItemSet = {
  currentLevelLabel: string | null;
  currentItems: Item[];
  otherItems: { label: string; items: Item[] }[];
  suggestedItemId: string | null;
};

const checkbox =
  "mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-700 focus:ring-brand-500 max-sm:h-5 max-sm:w-5";

export function MilestoneUpdateForm({
  dependentId,
  groupOptions,
  isFirst,
  items,
}: {
  dependentId: string;
  // Terisi kalau kelompok peserta belum bisa ditentukan dari tanggal lahir:
  // butir tiap kelompok ikut dikirim, tampil begitu kelompok dipilih (supaya
  // penilaian awal tetap bisa di catatan pertama).
  groupOptions: ({ value: string; label: string } & ItemSet)[] | null;
  isFirst: boolean;
  items: ItemSet | null;
}) {
  const [state, action, pending] = useActionState(saveMilestoneUpdate.bind(null, dependentId), null);
  const form = useRef<HTMLFormElement>(null);
  const [prior, setPrior] = useState(false);
  const [chosen, setChosen] = useState("");
  const set = items ?? groupOptions?.find((g) => g.value === chosen) ?? null;
  const currentItems = set?.currentItems ?? [];
  const otherItems = set?.otherItems ?? [];
  const focusOptions = [...currentItems, ...otherItems.flatMap((g) => g.items)];

  // Setelah sukses, halaman dimuat ulang server (bukan catatan pertama lagi),
  // jadi kotak "penilaian awal" hilang sendiri; cukup kosongkan isian.
  useEffect(() => {
    if (state?.success) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-4">
      {groupOptions && (
        <Field label="Kelompok umur (tanggal lahir peserta belum diisi)">
          <Select name="group" required value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="" disabled>
              Pilih kelompok
            </option>
            {groupOptions.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {isFirst && (
        <label className="flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-text">
          <input type="checkbox" name="prior" checked={prior} onChange={(e) => setPrior(e.target.checked)} className={checkbox} />
          <span>
            Ini penilaian awal
            <span className="block text-xs text-text-muted">
              Centang butir yang SUDAH bisa dilakukan peserta sebelum les di sini. Butir ini dicatat &quot;sudah bisa
              sebelumnya&quot; dan tidak masuk sertifikat.
            </span>
          </span>
        </label>
      )}

      {currentItems.length + otherItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-text-muted">
            {prior ? "Butir yang sudah bisa sebelumnya" : "Butir yang tercapai hari ini (opsional)"}
            {set?.currentLevelLabel ? ` — ${set.currentLevelLabel}` : ""}
          </p>
          {currentItems.map((it) => (
            <label key={it.id} className="flex items-start gap-2 text-sm text-text max-sm:min-h-[44px]">
              <input type="checkbox" name="achieved" value={it.id} className={checkbox} />
              <span>{it.text}</span>
            </label>
          ))}
          {otherItems.length > 0 && (
            <details open={prior} className="rounded-lg border border-border px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-text-muted">Butir di level lain</summary>
              <div className="mt-2 flex flex-col gap-3">
                {otherItems.map((g) => (
                  <div key={g.label} className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-text-muted">{g.label}</p>
                    {g.items.map((it) => (
                      <label key={it.id} className="flex items-start gap-2 text-sm text-text max-sm:min-h-[44px]">
                        <input type="checkbox" name="achieved" value={it.id} className={checkbox} />
                        <span>{it.text}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {focusOptions.length > 0 && (
        <Field label="Sedang dilatih (saran: butir berikutnya)">
          <Select key={`${chosen}-${set?.suggestedItemId}`} name="focusItemId" defaultValue={set?.suggestedItemId ?? ""}>
            <option value="">— Tidak dipilih —</option>
            {focusOptions.map((it) => (
              <option key={it.id} value={it.id}>
                {it.text}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Catatan perkembangan (wajib)">
        <Textarea
          name="note"
          rows={3}
          maxLength={1000}
          required
          placeholder="Misal: Sudah berani membenamkan wajah, napas samping masih tersendat. Minggu depan latihan meluncur."
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
          Simpan Update Milestone
        </Button>
        {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
        {state?.success && <p role="status" className="text-sm text-success-text">Tersimpan.</p>}
      </div>
    </form>
  );
}

export function AddItemForm({ dependentId, levels }: { dependentId: string; levels: { value: number; label: string }[] }) {
  const [state, action, pending] = useActionState(addMilestoneItem.bind(null, dependentId), null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-3">
      <Field label="Butir keterampilan tambahan">
        <Input name="text" maxLength={200} required placeholder="Misal: Meluncur telentang dari dinding sejauh 2 meter" />
      </Field>
      <Field label="Masuk ke level">
        <Select name="level" defaultValue={levels[0]?.value}>
          {levels.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </Select>
      </Field>
      <label className="flex items-start gap-2 text-sm text-text max-sm:min-h-[44px]">
        <input type="checkbox" name="propose" className={checkbox} />
        <span>
          Usulkan jadi butir standar SPH
          <span className="block text-xs text-text-muted">Kalau disetujui admin, butir ini berlaku untuk semua peserta di kelompok ini.</span>
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          Tambah Butir
        </Button>
        {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
        {state?.success && <p role="status" className="text-sm text-success-text">Butir ditambahkan.</p>}
      </div>
    </form>
  );
}
