const ADMIN_WHATSAPP_NUMBER = "6282117173124";

export function buildAdminWaLink(message: string) {
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function normalizePhoneForWa(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

export function buildWaLinkTo(phone: string, message: string) {
  return `https://wa.me/${normalizePhoneForWa(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildContactWaLink(phone: string, name: string) {
  const number = normalizePhoneForWa(phone);
  const message = `Halo ${name}, ini dari Admin Swim Private Hub.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// Coach shortcut page (pool-first browse + cheap cross-pool discovery,
// locked /plan-eng-review 2026-09-12): parent yang tau nama coach tapi
// coach-nya lagi di kolam yang beda dari paket parent itu, chat
// langsung ke coach-nya buat nanya arahan/pool mana yang cocok --
// bukan admin.
export function buildCoachInquiryWaLink(coachPhone: string, coachName: string) {
  const number = normalizePhoneForWa(coachPhone);
  const message = `Halo Coach ${coachName}, saya mau tanya jadwal/kolam buat les renang.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildAdminCancelWaLink({
  memberName,
  childName,
  coachName,
  dateLabel,
  timeRange,
}: {
  memberName: string;
  childName?: string;
  coachName: string;
  dateLabel: string;
  timeRange: string;
}) {
  const forLine = childName ? `\nBuat: ${childName}` : "";
  const message = `Halo Admin Swim Private Hub, saya mau minta bantuan batalkan booking:

Nama: ${memberName}${forLine}
Coach: ${coachName}
Jadwal: ${dateLabel}, ${timeRange}

Jatah pembatalan mandiri saya udah habis / di luar waktu yang diizinkan. Mohon dibantu ya, terima kasih.`;

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildOwnerInquiryWaLink() {
  const message =
    "Halo, saya punya kolam renang dan tertarik gabung jadi mitra Swim Private Hub. Boleh minta info lebih lanjut?";
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
