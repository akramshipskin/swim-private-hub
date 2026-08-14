import { EventEmitter } from "events";

// Singleton event bus buat notif "ada perubahan booking" ke semua client
// yang lagi connect SSE. Disimpen di globalThis biar gak kebuat ulang pas
// hot-reload dev server.
declare global {
  var __bookingEvents: EventEmitter | undefined;
}

export const bookingEvents = globalThis.__bookingEvents ?? new EventEmitter();
bookingEvents.setMaxListeners(0);

if (process.env.NODE_ENV !== "production") {
  globalThis.__bookingEvents = bookingEvents;
}

export function emitBookingChanged() {
  bookingEvents.emit("changed");
}
