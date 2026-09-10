// Kapitalisasi huruf depan tiap kata doang -- sengaja gak nge-lowercase
// sisanya, biar gak ngerusak nama yang emang sengaja ada huruf besar di
// tengah (misal "TTT", akronim, dst).
export function toProperCase(input: string): string {
  return input
    .split(" ")
    .map((word) => (word.length ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

// Nomor HP Indonesia: awalan 0/62/+62, diikuti 8, lalu 1-9, lalu 6-10 digit
// lagi -- nutupin panjang wajar nomor seluler (10-13 digit total) tanpa
// nolak variasi awalan yang umum dipake orang pas ngetik manual.
export function isValidIndonesianPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, "");
  return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(digits);
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
