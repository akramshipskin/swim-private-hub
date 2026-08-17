"use client";

import { useActionState, useState } from "react";
import { addAvailability } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Label } from "@/components/ui/input";
import { TimeSelect } from "@/components/ui/time-select";
import { AvailabilityDatePicker } from "@/components/availability-date-picker";
import { Button } from "@/components/ui/button";
import { todayWibDateString } from "@/lib/datetime";

export default function AddSlotForm() {
  const [state, formAction, pending] = useActionState(addAvailability, null);
  const [date, setDate] = useState(todayWibDateString());

  return (
    <Card className="mb-8 mt-5">
      <CardBody>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <Field label="Tanggal">
            <div className="w-56">
              <AvailabilityDatePicker
                value={date}
                onChange={setDate}
                fetchUrl="/api/coach/schedule-dates"
                legendLabel="udah ada slot"
              />
            </div>
            <input type="hidden" name="date" value={date} />
          </Field>
          <TimeSelect name="startTime" label="Jam mulai" defaultValue="08:00" />
          <TimeSelect name="endTime" label="Jam selesai" defaultValue="16:00" />
          <div className="flex items-center gap-1.5 pb-2">
            <input
              type="checkbox"
              name="splitHourly"
              id="splitHourly"
              defaultChecked
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="splitHourly" className="text-sm text-text">
              Pecah per jam (1 sesi = 1 member per jam)
            </Label>
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
        <p className="mt-2 text-xs text-text-subtle">
          Contoh: 08.00–10.00 + &ldquo;pecah per jam&rdquo; = 2 slot terpisah (08–09, 09–10),
          bisa dibooking 2 member beda. Kalau di-uncheck, jadi 1 slot utuh 08.00–10.00 buat 1
          member aja.
        </p>
      </CardBody>
    </Card>
  );
}
