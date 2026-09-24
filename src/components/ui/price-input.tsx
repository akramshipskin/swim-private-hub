"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

function formatThousands(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function PriceInput({
  id,
  name,
  defaultValue,
  disabled,
  required,
  className,
}: {
  // Diisi otomatis oleh <Field> supaya label tersambung ke kolom yang terlihat.
  id?: string;
  name: string;
  defaultValue?: number | string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(() =>
    defaultValue !== undefined && defaultValue !== "" ? formatThousands(String(defaultValue)) : ""
  );
  const raw = display.replace(/\./g, "");

  return (
    <>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={display}
        disabled={disabled}
        required={required}
        onChange={(e) => setDisplay(formatThousands(e.target.value.replace(/\D/g, "")))}
        className={className}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  );
}
