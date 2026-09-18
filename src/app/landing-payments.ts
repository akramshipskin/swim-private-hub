// Metode pembayaran yang tersedia lewat Midtrans. Logo dirender sebagai
// siluet satu warna (CSS mask) supaya seragam apa pun warna asli logonya.
// File logo: public/images/payments/ (SVG publik dari Wikimedia Commons &
// simple-icons). Metode tanpa file logo bebas lisensi ditulis sebagai teks.
//
// Karena mask mengubah semua area bercat jadi satu warna, logo yang detailnya
// berupa bagian putih di atas bentuk lain akan jadi siluet padat. Untuk itu
// dana.svg dipotong ke bagian wordmark saja (lingkaran biru + huruf D putih
// dibuang), dan BRI/ShopeePay memakai versi wordmark mendatar, bukan versi
// ikon kotak, supaya tingginya sepadan dengan logo lain di baris yang sama.
export const PAYMENT_METHODS: { label: string; logo?: string }[] = [
  { label: "QRIS", logo: "/images/payments/qris.svg" },
  { label: "GoPay", logo: "/images/payments/gopay.svg" },
  { label: "OVO", logo: "/images/payments/ovo.svg" },
  { label: "DANA", logo: "/images/payments/dana.svg" },
  { label: "ShopeePay", logo: "/images/payments/shopeepay.svg" },
  { label: "BCA", logo: "/images/payments/bca.svg" },
  { label: "Mandiri", logo: "/images/payments/mandiri.svg" },
  { label: "BNI", logo: "/images/payments/bni.svg" },
  { label: "BRI", logo: "/images/payments/bri.svg" },
  { label: "Permata", logo: "/images/payments/permata.svg" },
  { label: "Visa", logo: "/images/payments/visa.svg" },
  { label: "Mastercard", logo: "/images/payments/mastercard.svg" },
  { label: "JCB", logo: "/images/payments/jcb.svg" },
];
