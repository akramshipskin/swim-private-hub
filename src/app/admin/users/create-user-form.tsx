"use client";

import { useActionState, useState } from "react";
import { createUser } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

type Role = "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
type Participant = { type: "self" | "child"; name: string };

export default function CreateUserForm({ pools }: { pools: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createUser, null);
  const [role, setRole] = useState<Role>("MEMBER");
  const [participants, setParticipants] = useState<Participant[]>([{ type: "self", name: "" }]);
  const [newUserName, setNewUserName] = useState("");
  const [poolMode, setPoolMode] = useState<"existing" | "new">(pools.length > 0 ? "existing" : "new");

  function updateParticipant(i: number, patch: Partial<Participant>) {
    setParticipants((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  return (
    <Card>
      <CardBody>
        <h2 className="mb-4 text-sm font-semibold text-text">Tambah User Baru</h2>
        <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nama">
            <Input
              name="name"
              required
              className="w-full"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
          </Field>
          <Field label="No HP">
            <Input type="tel" name="phone" placeholder="0812xxxxxxx" required className="w-full" />
          </Field>
          <Field label="Email (opsional)">
            <Input type="email" name="email" className="w-full" />
          </Field>
          <Field label="Password">
            <PasswordInput name="password" required minLength={8} className="w-full" />
          </Field>
          <Field label="Role">
            <Select
              name="role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full"
            >
              <option value="MEMBER">Member</option>
              <option value="COACH">Coach</option>
              <option value="POOL_OWNER">Pemilik Kolam</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" loading={pending} className="w-full">
              Tambah
            </Button>
          </div>

          {role === "POOL_OWNER" && (
            <div className="col-span-1 flex flex-col gap-2 sm:col-span-2">
              <p className="text-sm font-medium text-text">Kolam yang dikelola</p>
              <div className="flex gap-4 text-sm text-text">
                {pools.length > 0 && (
                  <label className="flex items-center gap-2">
                    <input type="radio" name="poolMode" value="existing" checked={poolMode === "existing"} onChange={() => setPoolMode("existing")} />
                    Kolam yang sudah ada
                  </label>
                )}
                <label className="flex items-center gap-2">
                  <input type="radio" name="poolMode" value="new" checked={poolMode === "new"} onChange={() => setPoolMode("new")} />
                  Kolam baru
                </label>
              </div>
              {poolMode === "existing" ? (
                <Select name="poolId" required className="w-full">
                  {pools.map((pl) => (
                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                  ))}
                </Select>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input name="newPoolName" placeholder="Nama kolam" required />
                  <Input name="newPoolAddress" placeholder="Alamat kolam (opsional)" />
                </div>
              )}
              <p className="text-xs text-text-subtle">Kolam baru langsung aktif. Harga paket diatur di tab Paket, info &amp; fasilitas di tab Kolam.</p>
            </div>
          )}

          {role === "MEMBER" && (
            <div className="col-span-1 flex flex-col gap-2 sm:col-span-2">
              <p className="text-sm font-medium text-text">Siapa yang mau les?</p>
              <p className="text-xs text-text-subtle">
                Bisa diri sendiri, bisa anak, bisa keduanya. Bisa ditambah lagi nanti.
              </p>
              {participants.map((p, i) => {
                const selfTakenElsewhere = participants.some(
                  (other, idx) => idx !== i && other.type === "self"
                );
                return (
                  <div key={i} className="flex gap-2">
                    <Select
                      name="participantType"
                      value={p.type}
                      onChange={(e) => updateParticipant(i, { type: e.target.value as Participant["type"] })}
                      className="w-32 shrink-0"
                    >
                      {!selfTakenElsewhere && <option value="self">Diri sendiri</option>}
                      <option value="child">Anak</option>
                    </Select>
                    {p.type === "self" ? (
                      <>
                        <p className="flex min-h-[44px] min-w-0 flex-1 items-center truncate rounded-xl border border-border bg-surface-muted px-3 text-sm text-text-muted">
                          {newUserName || "(isi nama lengkap dulu)"}
                        </p>
                        <input type="hidden" name="participantName" value="" />
                      </>
                    ) : (
                      <Input
                        name="participantName"
                        value={p.name}
                        onChange={(e) => updateParticipant(i, { name: e.target.value })}
                        placeholder="Nama anak"
                        required
                        className="min-w-0 flex-1"
                      />
                    )}
                    {participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setParticipants((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Hapus peserta ini"
                        className="shrink-0 rounded-lg border border-border px-3 text-sm text-danger-text hover:bg-danger-bg"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setParticipants((prev) => [...prev, { type: "child", name: "" }])}
                className="self-start text-sm font-medium text-brand-600 hover:underline"
              >
                + Tambah peserta lain
              </button>
            </div>
          )}
        </form>
        {state?.error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {state.error}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
