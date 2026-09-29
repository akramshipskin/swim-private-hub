import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSelfDependent, parseParticipantBirthDate } from "@/lib/dependents";
import { identityTakenWhere, isValidIndonesianPhone, normalizeEmail, normalizePhone, toProperCase } from "@/lib/format";
import { consentData, CONSENT_REQUIRED_ERROR } from "@/lib/legal";
import { normalizeAffiliateCode } from "@/lib/affiliate";
import { clientIp, takeAttempt, RATE_LIMIT_REGISTER_ERROR, REGISTER_MEMBER_PER_IP, REGISTER_WINDOW_MS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const body = await request.json();
  const registeredIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const { name, phone: rawPhone, email: rawEmail, password, acceptedTerms, children, wantsSelf, selfBirthDate, entryReferrer, referralCode, website, formRenderedAt } =
    body as {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
      acceptedTerms?: boolean;
      children?: { name?: string; birthDate?: string }[];
      wantsSelf?: boolean;
      selfBirthDate?: string;
      entryReferrer?: string | null;
      referralCode?: string;
      website?: string;
      formRenderedAt?: number;
    };

  // Anti-spam sederhana: "website" itu honeypot (field kosong yang
  // disembunyikan dari user asli lewat CSS -- bot yang isi semua field
  // otomatis bakal ke-isi ini juga). formRenderedAt dipake buat nolak
  // submit yang lebih cepet dari waktu wajar buat isi form manual.
  if (website) {
    return Response.json({ error: "Registrasi gagal" }, { status: 400 });
  }
  if (typeof formRenderedAt === "number" && Date.now() - formRenderedAt < 1500) {
    return Response.json({ error: "Registrasi gagal, coba lagi" }, { status: 400 });
  }
  // entryReferrer dikirim client (document.referrer pas landing pertama,
  // disimpen di sessionStorage) -- itu sumber ASLI (WA/IG/Google/dll).
  // request.headers.get("referer") gak dipake lagi karena selalu isi
  // halaman register itu sendiri (fetch dari halaman yang sama), bukan
  // sumber sebelumnya. String kosong "" berarti direct/no-referrer valid,
  // bukan "gak ada data" -- cuma null/undefined yang jadi null.
  const registeredReferer = entryReferrer ?? null;

  if (!name || !rawPhone || !password) {
    return Response.json(
      { error: "Nama, No HP, dan password wajib diisi" },
      { status: 400 }
    );
  }

  if (!isValidIndonesianPhone(rawPhone)) {
    return Response.json(
      { error: "Format No HP tidak valid (contoh: 0812xxxxxxx)" },
      { status: 400 }
    );
  }

  const properName = toProperCase(name.trim());
  const cleanChildren = (children ?? [])
    .map((c) => ({ name: toProperCase((c?.name ?? "").trim()), birthDate: c?.birthDate ?? "" }))
    .filter((c) => c.name);
  if (cleanChildren.length === 0 && !wantsSelf) {
    return Response.json(
      { error: "Isi minimal 1 peserta (diri sendiri atau anak)" },
      { status: 400 }
    );
  }

  // Tanggal lahir wajib untuk SEMUA peserta yang didaftarkan (keputusan Hadi
  // 29 Sep, sama seperti "Tambah peserta"): level milestone ditentukan umur.
  let childrenData: { name: string; birthDate: Date }[];
  let selfBirth: Date | null = null;
  try {
    childrenData = cleanChildren.map((c) => ({ name: c.name, birthDate: parseParticipantBirthDate(c.birthDate) }));
    if (wantsSelf) selfBirth = parseParticipantBirthDate(selfBirthDate ?? "");
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Tanggal lahir tidak valid." }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json(
      { error: "Password minimal 8 karakter" },
      { status: 400 }
    );
  }

  const consent = consentData(acceptedTerms);
  if (!consent) {
    return Response.json({ error: CONSENT_REQUIRED_ERROR }, { status: 400 });
  }

  // Kode afiliasi opsional; kode yang diisi tapi tidak ada = ditolak (bukan
  // diam-diam diabaikan), supaya member tahu kodenya salah ketik.
  let referralCodeId: string | null = null;
  if (typeof referralCode === "string" && referralCode.trim()) {
    const found = await prisma.affiliateCode.findUnique({
      where: { code: normalizeAffiliateCode(referralCode) },
      select: { id: true },
    });
    if (!found) {
      return Response.json({ error: "Kode afiliasi tidak ditemukan. Cek lagi atau kosongkan." }, { status: 400 });
    }
    referralCodeId = found.id;
  }

  // Disimpan dalam bentuk baku (08xxxxxxxxxx, email huruf kecil) supaya
  // format ketik yang beda tidak jadi akun ganda.
  const phone = normalizePhone(rawPhone);
  const email = normalizeEmail(rawEmail);

  const existing = await prisma.user.findFirst({ where: identityTakenWhere(phone, email) });
  if (existing) {
    return Response.json(
      { error: "No HP atau email sudah terdaftar" },
      { status: 409 }
    );
  }

  const registerHit = await takeAttempt(`register:${clientIp(request.headers)}`, REGISTER_MEMBER_PER_IP, REGISTER_WINDOW_MS);
  if (!registerHit) {
    return Response.json({ error: RATE_LIMIT_REGISTER_ERROR }, { status: 429 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: properName,
          phone,
          email,
          passwordHash,
          role: "MEMBER",
          ...consent,
          registeredReferer,
          registeredIp,
          referralCodeId,
        },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });
      if (childrenData.length > 0) {
        await tx.dependent.createMany({
          data: childrenData.map((c) => ({ memberId: created.id, name: c.name, birthDate: c.birthDate })),
        });
      }
      if (selfBirth) {
        const self = await createSelfDependent(created.id, tx);
        await tx.dependent.update({ where: { id: self.id }, data: { birthDate: selfBirth } });
      }
      return created;
    });

    return Response.json({ user }, { status: 201 });
  } catch (err) {
    // Race jarang: 2 request register HP/email sama nyaris bersamaan,
    // lolos dari cek findFirst di atas berdua, tapi cuma 1 yang menang di DB.
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return Response.json({ error: "No HP atau email sudah terdaftar" }, { status: 409 });
    }
    throw err;
  }
}
