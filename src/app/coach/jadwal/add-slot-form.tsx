"use client";

import { useActionState, useState } from "react";
import { addAvailability } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { TimeSelect } from "@/components/ui/time-select";
import { AvailabilityDatePicker } from "@/components/availability-date-picker";
import { Button } from "@/components/ui/button";
import { todayWibDateString } from "@/lib/datetime";

type PoolOption = { id: string; name: string; hours: string };

export default function AddSlotForm({ pools }: { pools: PoolOption[] }) {
  const [state, formAction, pending] = useActionState(addAvailability, null);
  const [date, setDate] = useState(todayWibDateString());

  if (pools.length === 0) {
    return (
      <Card className="mb-8 mt-5">
        <CardBody className="py-6 text-center text-sm text-text-muted">
          Kamu belum memilih kolam tempat mengajar.{" "}
          <a href="/coach/kolam" className="font-medium text-brand-700 underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">Pilih kolam di menu Kolam Saya</a>{" "}
          supaya bisa membuka jadwal.
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mb-8 mt-5">
      <CardBody>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {/* 1 coach bisa terafiliasi ke banyak kolam (PoolAffiliation) --
              slot yang dibuka WAJIB pin ke 1 kolam spesifik, jadi
              dropdown ini wajib dipilih tiap buka slot, gak ada
              default "semua kolam". */}
          <Field label="Kolam">
            <Select name="poolId" defaultValue={pools[0].id} className="w-full sm:w-60">
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {/* Slot hanya bisa dibuka di dalam jam buka kolam. */}
                  {p.name} · buka {p.hours}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal">
            <div className="w-56">
              <AvailabilityDatePicker
                value={date}
                onChange={setDate}
                fetchUrl="/api/coach/schedule-dates"
                legendLabel="sudah ada jadwal"
              />
            </div>
            <input type="hidden" name="date" value={date} />
          </Field>
          <div className="flex items-end gap-3">
            <TimeSelect name="startTime" label="Jam Mulai" defaultValue="08:00" hourOnly />
            <TimeSelect name="endTime" label="Jam Selesai" defaultValue="16:00" hourOnly />
          </div>
          <Button type="submit" loading={pending}>
            Buka Jam Kosong
          </Button>
        </form>
        {state?.error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {state.error}
          </p>
        )}
        {state?.warning && (
          <p role="alert" className="mt-3 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
            {state.warning}
          </p>
        )}
        <p className="mt-2 text-xs text-text-subtle">
          Rentang jam otomatis dipecah per jam. Misalnya 08.00–10.00 menjadi 2 jam terpisah (08.00–09.00
          dan 09.00–10.00), masing-masing bisa dibooking member yang berbeda. Jam 12.00–13.00 (istirahat)
          tidak dibuka.
        </p>
      </CardBody>
    </Card>
  );
}
