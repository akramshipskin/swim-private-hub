"use client";

import { useActionState, useState } from "react";
import { addAvailability } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { TimeSelect } from "@/components/ui/time-select";
import { AvailabilityDatePicker } from "@/components/availability-date-picker";
import { Button } from "@/components/ui/button";
import { todayWibDateString } from "@/lib/datetime";

type PoolOption = { id: string; name: string };

export default function AddSlotForm({ pools }: { pools: PoolOption[] }) {
  const [state, formAction, pending] = useActionState(addAvailability, null);
  const [date, setDate] = useState(todayWibDateString());

  if (pools.length === 0) {
    return (
      <Card className="mb-8 mt-5">
        <CardBody className="py-6 text-center text-sm text-text-muted">
          Kamu belum terafiliasi ke kolam manapun. Hubungi admin agar bisa buka jadwal.
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
                  {p.name}
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
                legendLabel="sudah ada slot"
              />
            </div>
            <input type="hidden" name="date" value={date} />
          </Field>
          <div className="flex items-end gap-3">
            <TimeSelect name="startTime" label="Jam mulai" defaultValue="08:00" hourOnly />
            <TimeSelect name="endTime" label="Jam selesai" defaultValue="16:00" hourOnly />
          </div>
          <Button type="submit" loading={pending}>
            Tambah Slot
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
          Slot otomatis dipecah per jam — misal 08.00–10.00 jadi 2 slot terpisah (08–09,
          09–10), masing-masing bisa dibooking member beda. Jam 12.00–13.00 (istirahat) tidak
          dijadiin slot.
        </p>
      </CardBody>
    </Card>
  );
}
