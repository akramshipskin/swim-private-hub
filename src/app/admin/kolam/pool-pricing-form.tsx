"use client";

import PackPriceForm from "@/components/pack-price-form";
import { Field, Input } from "@/components/ui/input";
import { updatePoolPricing } from "./actions";

export default function PoolPricingForm({
  poolId,
  pricePack4,
  pricePack8,
  serviceFeeBps,
  pphExempt,
}: {
  poolId: string;
  pricePack4: number | null;
  pricePack8: number | null;
  serviceFeeBps: number;
  pphExempt: boolean;
}) {
  return (
    <PackPriceForm action={updatePoolPricing} hidden={{ poolId }} pricePack4={pricePack4} pricePack8={pricePack8}>
      {(locked) => (
        <>
          <Field label="Biaya layanan SPH (%)">
            <Input name="serviceFeePercent" inputMode="decimal" defaultValue={String(serviceFeeBps / 100).replace(".", ",")} disabled={locked} className="w-24" />
          </Field>
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-text">
            <input type="checkbox" name="pphExempt" defaultChecked={pphExempt} disabled={locked} className="h-4 w-4" />
            Bebas potongan PPh 0,5%
          </label>
        </>
      )}
    </PackPriceForm>
  );
}
