// Metode pembayaran yang tersedia lewat Midtrans. Logo dirender sebagai
// siluet satu warna (CSS mask) supaya seragam apa pun warna asli logonya.
// File logo: public/images/payments/ (SVG publik dari Wikimedia Commons &
// simple-icons). Metode tanpa file logo bebas lisensi ditulis sebagai teks.
export const PAYMENT_METHODS: { label: string; logo?: string }[] = [
  { label: "QRIS", logo: "/images/payments/qris.svg" },
  { label: "GoPay", logo: "/images/payments/gopay.svg" },
  { label: "OVO", logo: "/images/payments/ovo.svg" },
  { label: "DANA" },
  { label: "ShopeePay" },
  { label: "BCA", logo: "/images/payments/bca.svg" },
  { label: "Mandiri", logo: "/images/payments/mandiri.svg" },
  { label: "BNI", logo: "/images/payments/bni.svg" },
  { label: "BRI" },
  { label: "Permata", logo: "/images/payments/permata.svg" },
  { label: "Visa", logo: "/images/payments/visa.svg" },
  { label: "Mastercard", logo: "/images/payments/mastercard.svg" },
  { label: "JCB", logo: "/images/payments/jcb.svg" },
];
