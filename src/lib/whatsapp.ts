const ADMIN_WHATSAPP_NUMBER = "6281573400086";

export function buildAdminCancelWaLink({
  memberName,
  coachName,
  dateLabel,
  timeRange,
}: {
  memberName: string;
  coachName: string;
  dateLabel: string;
  timeRange: string;
}) {
  const message = `Halo Admin Les Renang Cianjur, saya mau minta bantuan batalkan booking:

Nama: ${memberName}
Coach: ${coachName}
Jadwal: ${dateLabel}, ${timeRange}

Jatah pembatalan mandiri saya udah habis / di luar waktu yang diizinkan. Mohon dibantu ya, terima kasih.`;

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
