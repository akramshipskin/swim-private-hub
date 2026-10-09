import { describe, expect, it } from "vitest";
import { hasPersonalContact } from "./contact-filter";

describe("hasPersonalContact", () => {
  it.each([
    "WA saya 081234567890",
    "hubungi 0812-3456-7890",
    "hubungi 0812 3456 7890 ya",
    "+62 812 3456 7890",
    "6281234567890",
    "chat di wa.me/6281234567890",
    "https://chat.whatsapp.com/abc",
    "telegram t.me/coachbudi",
    "budi@gmail.com",
    "0 8 1 2 3 4 5 6 7 8 9",
  ])("menolak: %s", (text) => {
    expect(hasPersonalContact(text)).toBe(true);
  });

  it.each([
    "",
    null,
    undefined,
    "Berpengalaman 10 tahun, 25 meter gaya bebas tanpa berhenti",
    "Tendangan kaki 10 meter, napas 3 kali, 5 detik mengapung",
    "Tarif Rp1.500.000 - 2.500.000 per paket",
    "Latihan 20 menit, 15 detik istirahat, 4 set 25 meter 3 kali",
    "Lahir 2015, ikut lomba 2024",
  ])("menerima: %s", (text) => {
    expect(hasPersonalContact(text)).toBe(false);
  });
});
