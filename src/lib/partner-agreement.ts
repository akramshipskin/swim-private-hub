// Perjanjian kemitraan coach & MOU kolam disetujui lewat centang di aplikasi
// (Hadi 2 Okt, 3A; sah karena layanan online). Satu kolom versi di User:
// coach menyetujui perjanjian coach, pemilik kolam menyetujui MOU kolam.
//
// Versi null = teks belum final ([ISI HADI] belum diisi): centang tidak
// diminta di pendaftaran dan akun lama tidak diarahkan ke halaman setuju.
// Isi versi (mis. "Perjanjian Coach 5 Oktober 2026") begitu teksnya tayang;
// mengubah versi = semua coach/pemilik kolam diminta setuju ulang (Hadi 4A).
export const PARTNER_AGREEMENTS = {
  COACH: { version: null as string | null, title: "Perjanjian Kemitraan Coach", href: "/perjanjian-coach" },
  POOL_OWNER: { version: null as string | null, title: "MOU Kolam Mitra", href: "/mou-kolam" },
};

type PartnerRole = keyof typeof PARTNER_AGREEMENTS;

function isPartnerRole(role: string): role is PartnerRole {
  return role === "COACH" || role === "POOL_OWNER";
}

export function partnerAgreementFor(role: string) {
  if (!isPartnerRole(role)) return null;
  const doc = PARTNER_AGREEMENTS[role];
  return doc.version ? { ...doc, version: doc.version } : null;
}

// Akun coach/pemilik kolam yang belum menyetujui versi yang berlaku.
export function needsPartnerAgreement(role: string, acceptedVersion: string | null | undefined): boolean {
  const doc = partnerAgreementFor(role);
  return doc !== null && acceptedVersion !== doc.version;
}

// Data yang disimpan saat menyetujui. {} bila perjanjian untuk peran ini
// belum aktif (tidak ada yang dicatat). Centang dicek server, bukan browser.
export function partnerAgreementData(role: string, accepted: unknown, now = new Date()) {
  const doc = partnerAgreementFor(role);
  if (!doc) return {};
  if (accepted !== true) return null;
  return { partnerAgreementAcceptedAt: now, partnerAgreementVersion: doc.version };
}

export const PARTNER_AGREEMENT_REQUIRED_ERROR = "Setujui perjanjian kemitraan dulu";
