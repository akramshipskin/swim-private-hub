// Email otomatis (notifikasi Midtrans, pantulan surel, dsb) tidak perlu dibalas
// admin: tetap disimpan di kotak masuk, tapi tidak dihitung "menunggu dibalas"
// dan tidak mengirim notifikasi HP (Hadi 6 Okt, 10A). Pengenal: bagian depan
// alamat pengirim (sebelum @) seperti noreply / do-not-reply / mailer-daemon.
const AUTOMATED_LOCAL_PART = /^(no[-_.]?reply|do[-_.]?not[-_.]?reply|mailer-daemon|postmaster|bounces?)([+_.-].*)?$/i;

export function isAutomatedSender(from: string) {
  // "Nama <alamat@host>" atau alamat polos.
  const address = (/<([^>]+)>/.exec(from)?.[1] ?? from).trim();
  const at = address.lastIndexOf("@");
  if (at <= 0) return false;
  return AUTOMATED_LOCAL_PART.test(address.slice(0, at));
}
