// Pesan error yang aman ditampilkan ke pengguna. Error buatan kita (validasi)
// boleh tampil apa adanya; error database/Prisma memuat detail internal (nama
// file, kolom, nilai) jadi diganti pesan umum dan dicatat di log server.
export function userErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error) || err.name.startsWith("PrismaClient") || "clientVersion" in err) {
    console.error(err);
    return fallback;
  }
  return err.message;
}
