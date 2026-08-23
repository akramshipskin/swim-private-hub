// Kapitalisasi huruf depan tiap kata doang -- sengaja gak nge-lowercase
// sisanya, biar gak ngerusak nama yang emang sengaja ada huruf besar di
// tengah (misal "TTT", akronim, dst).
export function toProperCase(input: string): string {
  return input
    .split(" ")
    .map((word) => (word.length ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
