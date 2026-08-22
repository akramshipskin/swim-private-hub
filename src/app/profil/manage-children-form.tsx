"use client";

import { useActionState, useState } from "react";
import { addChild, toggleChildActive } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Child = { id: string; name: string; isActive: boolean; isSelf: boolean };

export default function ManageChildrenForm({ children }: { children: Child[] }) {
  const [state, formAction, pending] = useActionState(addChild, null);
  const [type, setType] = useState<"self" | "child">("child");
  const active = children.filter((c) => c.isActive);
  const inactive = children.filter((c) => !c.isActive);
  const hasSelf = children.some((c) => c.isSelf);

  return (
    <div className="flex flex-col gap-4">
      {active.length === 0 && inactive.length === 0 ? (
        <p className="text-sm text-text-muted">Belum ada anak terdaftar.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <span className="text-sm font-medium text-text">
                {c.name}
                {c.isSelf && <span className="ml-1.5 text-xs font-normal text-text-subtle">(kamu)</span>}
              </span>
              <button
                type="button"
                onClick={() => toggleChildActive(c.id, false)}
                className="text-xs font-medium text-danger-text hover:underline"
              >
                Nonaktifkan
              </button>
            </li>
          ))}
          {inactive.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2"
            >
              <span className="text-sm text-text-subtle">{c.name}</span>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">Nonaktif</Badge>
                <button
                  type="button"
                  onClick={() => toggleChildActive(c.id, true)}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Aktifkan
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex items-end gap-2">
        <div className="w-32 shrink-0">
          <Field label="Tipe">
            <Select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as "self" | "child")}
            >
              <option value="child">Anak</option>
              <option value="self" disabled={hasSelf}>
                Diri sendiri
              </option>
            </Select>
          </Field>
        </div>
        {type === "child" && (
          <div className="flex-1">
            <Field label="Nama anak">
              <Input name="name" placeholder="Nama anak" required />
            </Field>
          </div>
        )}
        <Button type="submit" variant="secondary" size="sm" loading={pending}>
          Tambah
        </Button>
      </form>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {state.error}
        </p>
      )}
    </div>
  );
}
