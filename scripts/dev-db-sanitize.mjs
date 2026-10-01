// Penyamaran data production sebelum masuk database dev lokal (dipakai
// dev-db-sync.mjs). Tujuan: laptop developer tidak menyimpan data pribadi
// asli (nama member/anak, HP, email, rekening, isi chat/email) maupun
// rahasia login (hash password, kunci 2FA) dari production.
//
// Fail closed: SETIAP kolom setiap tabel harus diklasifikasi di POLICY
// (disalin apa adanya, atau diganti). Tabel/kolom baru di skema yang belum
// diklasifikasi membuat sinkronisasi berhenti, bukan diam-diam tersalin mentah.
//
// Yang sengaja DISALIN apa adanya: data yang memang sudah publik di landing
// (nama/alamat/foto kolam, profil coach selain rekening) dan angka transaksi
// (harga, saldo, ledger) supaya bug uang tetap bisa direproduksi. Catatan
// admin (WalletTransaction.note, PlatformWithdrawal.note, failureReason) juga
// disalin: teks operasional buatan admin, dibutuhkan untuk menelusuri koreksi.

const KEEP = Symbol("keep");
const keep = (...cols) => Object.fromEntries(cols.map((c) => [c, KEEP]));
const pad = (n, width) => String(n).padStart(width, "0");

const ROLE_LABEL = { ADMIN: "Admin", COACH: "Coach", MEMBER: "Member", POOL_OWNER: "Pemilik Kolam" };
const BANK = { bankName: () => "BCA", bankAccountNumber: (r, i) => `9${pad(i, 9)}`, bankAccountName: (r, i) => `Rekening Dev ${i}` };

// null = tabel tidak disalin sama sekali (isinya tidak berguna di lokal dan
// berisiko): langganan push = alamat notifikasi HP asli (kalau disalin, uji
// lokal bisa mengirim notifikasi ke HP orang sungguhan); RateLimitHit = key
// berisi IP/HP, cuma data sementara.
export const POLICY = {
  PushSubscription: null,
  RateLimitHit: null,

  User: {
    ...keep("id", "role", "isActive", "mustChangePassword", "sessionVersion", "createdAt", "termsAcceptedAt", "termsVersion", "deletionRequestedAt", "anonymizedAt", "approvedAt", "referralCodeId"),
    name: (r, i) => `${ROLE_LABEL[r.role] ?? "User"} ${i}`,
    phone: (r, i) => `0899${pad(i, 8)}`,
    email: (r, i) => (r.email == null ? null : `user${i}@dev.invalid`),
    passwordHash: (r, i, ctx) => ctx.devPasswordHash,
    registeredIp: () => null,
    registeredReferer: () => null,
    // Admin wajib pasang 2FA lagi di lokal (halaman /keamanan) -- kunci asli tidak ikut.
    totpSecret: () => null,
    totpEnabledAt: () => null,
    totpLastStep: () => null,
  },
  Dependent: {
    ...keep("id", "memberId", "isSelf", "isActive", "createdAt", "milestoneGroup"),
    name: (r, i) => `Peserta ${i}`,
    // Tanggal lahir asli anak disamarkan jadi 1 Januari tahun yang sama:
    // kelompok umur (untuk level milestone) tetap benar.
    birthDate: (r) => (r.birthDate == null ? null : new Date(Date.UTC(new Date(r.birthDate).getUTCFullYear(), 0, 1))),
  },
  CoachProfile: {
    ...keep("id", "userId", "bio", "specialties", "isActive", "hasCertification", "certificationNote", "photoUrl", "birthDate", "gender", "walletBalance", "signaturePath", "pricePack4", "pricePack8", "pphExempt"),
    ...BANK,
  },
  // Nama sertifikat tampil publik di profil coach; filePath menunjuk bucket
  // privat production.
  // Milestone: butir & pencapaian disalin (tidak berisi data pribadi, perlu
  // untuk mereproduksi hitungan level/penahanan). Isi catatan coach = teks
  // bebas tentang anak, diganti.
  MilestoneItem: keep("id", "group", "level", "sortOrder", "text", "dependentId", "createdById", "proposalStatus", "isActive", "createdAt"),
  MilestoneAchievement: keep("id", "dependentId", "itemId", "coachId", "priorSkill", "achievedAt"),
  MilestoneNote: {
    ...keep("id", "dependentId", "coachId", "focusItemId", "createdAt"),
    note: (r, i) => `Catatan dev ${i}`,
  },
  MilestoneLevelCompletion: keep("id", "dependentId", "group", "level", "coachId", "withCertificate", "completedAt"),
  // Afiliasi: kode & komisi tidak berisi data pribadi (angka uang disalin
  // supaya bug komisi bisa direproduksi).
  AffiliateCode: keep("id", "code", "coachProfileId", "poolId", "createdAt"),
  AffiliateCommission: keep("id", "memberId", "coachProfileId", "poolId", "paymentId", "amount", "status", "bookingId", "releaseAt", "releasedAt", "createdAt"),
  // Testimoni: teks publik di landing (nama & peran sudah izin tampil).
  Testimonial: keep("id", "name", "role", "quote", "consentNote", "isPublished", "sortOrder", "createdAt"),
  CoachCertificate: keep("id", "coachProfileId", "name", "filePath", "status", "reviewedAt", "createdAt"),
  Pool: {
    ...keep("id", "name", "address", "openTime", "closeTime", "description", "facilities", "photos", "commissionPercent", "coachSharePercent", "pricePack4", "pricePack8", "serviceFeeBps", "pphExempt", "walletBalance", "isActive", "createdAt"),
    contactPhone: (r, i) => (r.contactPhone == null ? null : `0898${pad(i, 8)}`),
    ...BANK,
  },
  WithdrawalRequest: {
    ...keep("id", "poolId", "coachProfileId", "amount", "status", "processedById", "failureReason", "requestedAt", "processedAt"),
    ...BANK,
    midtransReferenceId: (r, i) => (r.midtransReferenceId == null ? null : `DEV-MT-${i}`),
    transferReference: (r, i) => (r.transferReference == null ? null : `DEV-TRF-${i}`),
  },
  Payment: {
    ...keep("id", "packageId", "midtransOrderId", "amount", "status", "paidAt", "createdAt", "updatedAt"),
    // Payload webhook Midtrans memuat data pembayar; link Snap = token bayar asli.
    rawWebhookPayload: () => null,
    snapRedirectUrl: () => null,
  },
  ChatThread: keep("id", "userId", "needsAdmin", "updatedAt", "createdAt"),
  ChatMessage: {
    ...keep("id", "threadId", "sender", "createdAt"),
    content: (r, i) => `[isi chat disamarkan #${i}]`,
  },
  EmailThread: {
    ...keep("id", "needsAdmin", "updatedAt", "createdAt"),
    externalEmail: (r, i) => `kontak${i}@dev.invalid`,
    subject: (r, i) => `Email disamarkan #${i}`,
  },
  EmailMessage: {
    ...keep("id", "threadId", "direction", "createdAt"),
    fromAddress: (r) => (r.direction === "OUTBOUND" ? "hello@dev.invalid" : `pengirim-${r.threadId}@dev.invalid`),
    toAddress: (r) => (r.direction === "OUTBOUND" ? `pengirim-${r.threadId}@dev.invalid` : "hello@dev.invalid"),
    subject: (r, i) => `Email disamarkan #${i}`,
    textBody: (r, i) => `[isi email disamarkan #${i}]`,
    htmlBody: () => null,
    // resendId asli bisa dipakai membalas/menarik email sungguhan.
    resendId: () => null,
  },

  // Tanpa data pribadi: salin apa adanya.
  PlatformWithdrawal: {
    ...keep("id", "revenueAmount", "taxAmount", "note", "createdById", "createdAt"),
    transferReference: (r, i) => (r.transferReference == null ? null : `DEV-PLAT-${i}`),
  },
  // Keterangan laporan ditulis member (teks bebas, bisa berisi data pribadi).
  // Catatan hasil pemeriksaan ditulis admin: disalin, seperti note ledger.
  AttendanceReport: {
    ...keep("id", "bookingId", "memberId", "status", "resolution", "resolvedById", "resolvedAt", "createdAt"),
    note: (r) => (r.note == null ? null : "Keterangan laporan (disamarkan)"),
  },
  WalletTransaction: keep("id", "type", "poolId", "coachProfileId", "amount", "paymentId", "bookingId", "withdrawalRequestId", "note", "createdById", "idempotencyKey", "createdAt"),
  PackageTemplate: keep("id", "poolId", "name", "totalSesi", "price", "durationDays", "jatahCancel", "isTrial", "isActive", "pendingChanges", "createdAt"),
  Package: keep("id", "memberId", "dependentId", "poolId", "templateId", "name", "totalSesi", "sisaSesi", "jatahCancel", "isSingleSession", "isTrial", "status", "startDate", "expiredDate", "createdAt", "coachId", "poolPrice", "coachPrice", "serviceFee", "durationDays"),
  Availability: keep("id", "coachId", "poolId", "date", "startTime", "endTime", "kapasitas", "status", "recurrenceRule", "createdAt"),
  PoolOwnership: keep("id", "poolId", "ownerId", "createdAt"),
  PoolAffiliation: keep("id", "poolId", "coachId", "createdAt"),
  Booking: keep("id", "memberId", "availabilityId", "packageId", "status", "cancelledBy", "cancelledAt", "attended", "attendedBy", "attendedAt", "createdAt"),
};

// Kembalikan true kalau tabel disalin, false kalau sengaja dilewati.
// Lempar error kalau tabel belum diklasifikasi.
export function shouldCopyTable(table) {
  if (!(table in POLICY)) {
    throw new Error(`Tabel "${table}" belum diklasifikasi di scripts/dev-db-sanitize.mjs. Tambahkan aturannya dulu.`);
  }
  return POLICY[table] !== null;
}

// i = nomor urut baris di tabel itu (mulai 1), dipakai untuk nilai palsu yang unik.
export function sanitizeRow(table, row, i, ctx) {
  const rules = POLICY[table];
  const out = {};
  for (const col of Object.keys(row)) {
    const rule = rules[col];
    if (rule === undefined) {
      throw new Error(`Kolom "${table}.${col}" belum diklasifikasi di scripts/dev-db-sanitize.mjs. Tambahkan aturannya dulu.`);
    }
    out[col] = rule === KEEP ? row[col] : rule(row, i, ctx);
  }
  return out;
}
