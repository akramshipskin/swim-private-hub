// Metode bayar yang ditawarkan di Midtrans Snap. Kartu kredit tidak ditawarkan
// (Hadi 2 Okt): biaya Midtrans ditanggung SPH dan tidak boleh dibebankan ke
// pembeli (aturan BI); biaya kartu ~2,9% hampir menghabiskan biaya layanan.
export const NON_CARD_PAYMENTS = [
  "gopay",
  "shopeepay",
  "other_qris",
  "bca_va",
  "bni_va",
  "bri_va",
  "cimb_va",
  "permata_va",
  "echannel",
  "other_va",
] as const;
