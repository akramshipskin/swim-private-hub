"use client";

import PackPriceForm from "@/components/pack-price-form";
import { updateCoachPricing } from "../coach-pricing-actions";

export default function CoachPricingForm({
  userId,
  pricePack4,
  pricePack8,
  pphExempt,
}: {
  userId: string;
  pricePack4: number | null;
  pricePack8: number | null;
  pphExempt: boolean;
}) {
  return (
    <PackPriceForm action={updateCoachPricing} hidden={{ userId }} pricePack4={pricePack4} pricePack8={pricePack8}>
      {(locked) => (
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-text">
          <input type="checkbox" name="pphExempt" defaultChecked={pphExempt} disabled={locked} className="h-4 w-4" />
          Bebas potongan PPh 0,5%
        </label>
      )}
    </PackPriceForm>
  );
}
