"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

function formatThousands(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function PriceInput({
  name,
  defaultValue,
  disabled,
  required,
  className,
}: {
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
