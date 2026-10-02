// Perjanjian kemitraan coach & MOU kolam disetujui lewat centang di aplikasi
// (Hadi 2 Okt, 3A; sah karena layanan online). Satu kolom versi di User:
// coach menyetujui perjanjian coach, pemilik kolam menyetujui MOU kolam.
//
// Versi sudah diisi 2 Okt 2026: teks final tayang di /perjanjian-coach dan
// /mou-kolam (isian [ISI HADI] disetujui Hadi 2 Okt). Sejak itu centang
// diminta saat daftar coach/kolam, dan akun lama diarahkan ke /perjanjian
// sampai menyetujui. Versi null = mekanisme mati (tidak diminta, tidak dicatat).
// Mengubah teks halaman = ganti versi = semua coach/pemilik kolam diminta
// setuju ulang (Hadi 4A). Versi coach dan kolam wajib berbeda (awali dengan
// nama dokumen): kolom versinya satu, jadi pemilik kolam yang dulunya coach
// (atau sebaliknya) tidak dianggap sudah setuju.
export const PARTNER_AGREEMENTS = {
  COACH: { version: "Perjanjian Coach 2 Oktober 2026" as string | null, title: "Perjanjian Kemitraan Coach", href: "/perjanjian-coach" },
  POOL_OWNER: { version: "MOU Kolam 2 Oktober 2026" as string | null, title: "MOU Kolam Mitra", href: "/mou-kolam" },
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
