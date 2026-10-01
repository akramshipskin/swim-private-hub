import { toProperCase } from "@/lib/format";
import { MAX_NAME } from "@/lib/register-input";

// Tanggal lahir peserta dari input form (YYYY-MM-DD). Disimpan tengah malam
// UTC -- konvensi yang dibaca ageFromBirthDate. Peserta bisa bayi sampai
// dewasa, jadi batasnya longgar: tidak di masa depan, umur maksimal 100.
export function parseParticipantBirthDate(raw: string, now: Date = new Date()): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("Isi tanggal lahir peserta.");
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw) throw new Error("Tanggal lahir tidak valid.");
  if (d.getTime() > now.getTime()) throw new Error("Tanggal lahir tidak boleh di masa depan.");
  if (now.getUTCFullYear() - d.getUTCFullYear() > 100) throw new Error("Tanggal lahir tidak masuk akal.");
  return d;
}

export type ParsedParticipants = {
  wantsSelf: boolean;
  selfBirthDate: Date | null;
  children: { name: string; birthDate: Date }[];
};

// Baris peserta dari form (admin buat akun member, ganti password pertama):
// tiap baris punya participantType / participantName / participantBirthDate
// dengan urutan yang sama. Tanggal lahir WAJIB untuk tiap baris (keputusan
// Hadi 29-30 Sep) -- lempar Error berisi pesan siap tampil kalau salah.
// Baris anak tanpa nama dilewati (sama seperti sebelumnya).
export function readParticipants(formData: FormData, now: Date = new Date()): ParsedParticipants {
  const types = formData.getAll("participantType").map(String);
  const names = formData.getAll("participantName").map(String);
  const dates = formData.getAll("participantBirthDate").map((v) => String(v).trim());
  let wantsSelf = false;
  let selfBirthDate: Date | null = null;
  const children: ParsedParticipants["children"] = [];
  types.forEach((type, i) => {
    if (type === "self") {
      wantsSelf = true;
      selfBirthDate = parseParticipantBirthDate(dates[i] ?? "", now);
    } else if (type === "child") {
      const name = names[i]?.trim();
      if (!name) return;
      if (name.length > MAX_NAME) throw new Error(`Nama peserta maksimal ${MAX_NAME} karakter.`);
      children.push({ name: toProperCase(name), birthDate: parseParticipantBirthDate(dates[i] ?? "", now) });
    }
  });
  return { wantsSelf, selfBirthDate, children };
}

// Kolom "Tanggal Lahir" di impor Excel (opsional): terima 2019-05-17,
// 17/05/2019, 17-05-2019, atau angka tanggal Excel (43602). Kosong atau tidak
// terbaca -> null; pemanggil melaporkan supaya member melengkapinya sendiri.
export function parseImportBirthDate(raw: string | null | undefined, now: Date = new Date()): Date | null {
  const s = raw?.trim();
  if (!s) return null;
  const pad = (n: string) => n.padStart(2, "0");
  let iso: string | null = null;
  let m: RegExpExecArray | null;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) iso = `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  else if ((m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s))) iso = `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  else if (/^\d{4,6}$/.test(s)) iso = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86_400_000).toISOString().slice(0, 10);
  if (!iso) return null;
  try {
    return parseParticipantBirthDate(iso, now);
  } catch {
    return null;
  }
}
