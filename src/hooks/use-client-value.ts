"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// Nilai yang cuma bisa dibaca di browser (localStorage, navigator) tanpa
// setState di dalam effect: server & hydration pakai serverValue, lalu
// client langsung pakai getSnapshot. getSnapshot harus mengembalikan
// primitif (string/boolean) supaya stabil.
export function useClientValue<T extends string | boolean>(getSnapshot: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, getSnapshot, () => serverValue);
}
