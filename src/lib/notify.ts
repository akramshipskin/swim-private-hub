import { sendPushToRole, sendPushToUser } from "@/lib/push";

// Notifikasi pelengkap: gagal kirim TIDAK boleh menggagalkan aksi utamanya
// (pendaftaran, unggah, keputusan admin). Dipakai untuk kejadian yang butuh
// tindakan admin dan untuk kabar keputusan admin ke coach.
export async function notifyAdmins(title: string, body: string, url: string) {
  await sendPushToRole("ADMIN", { title, body, url }).catch(() => {});
}

export async function notifyUser(userId: string, title: string, body: string, url: string) {
  await sendPushToUser(userId, { title, body, url }).catch(() => {});
}
