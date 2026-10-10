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
  const forLine = childName ? `\nPeserta: ${childName}` : "";
  const message = `Halo Admin Swim Private Hub, saya ingin minta bantuan membatalkan booking:

Nama: ${memberName}${forLine}
Coach: ${coachName}
Jadwal: ${dateLabel}, ${timeRange}

Jatah pembatalan mandiri saya sudah habis / di luar waktu yang diizinkan. Mohon bantuannya, terima kasih.`;

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildOwnerInquiryWaLink() {
  const message =
    "Halo, saya punya kolam renang dan tertarik bergabung menjadi kolam mitra Swim Private Hub. Boleh minta info lebih lanjut?";
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Kabar persetujuan pendaftaran mitra, dikirim admin dari WhatsApp-nya sendiri
// (pendaftar belum bisa membuka lonceng sebelum masuk).
export function buildApprovalWaLink(phone: string, name: string, role: "COACH" | "POOL_OWNER") {
  const as = role === "COACH" ? "coach" : "kolam mitra";
  const message = `Halo ${name}, pendaftaranmu sebagai ${as} Swim Private Hub sudah disetujui. Silakan masuk di https://www.swimprivatehub.biz.id/login dengan nomor HP dan password yang kamu buat saat daftar. Terima kasih!`;
  return buildWaLinkTo(phone, message);
}

// Kabar penolakan pendaftaran (Hadi 10-11 Okt): boleh daftar ulang dengan nomor yang sama.
export function buildRejectionWaLink(phone: string, name: string, role: "COACH" | "POOL_OWNER", reason: string) {
  const as = role === "COACH" ? "coach" : "kolam mitra";
  const message = `Halo ${name}, terima kasih sudah mendaftar sebagai ${as} Swim Private Hub. Mohon maaf, pendaftaranmu belum bisa kami setujui. Alasannya: ${reason} Kamu boleh mendaftar ulang dengan nomor HP yang sama setelah melengkapinya di https://www.swimprivatehub.biz.id.`;
  return buildWaLinkTo(phone, message);
}
