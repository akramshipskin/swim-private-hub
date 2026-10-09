import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { identityTakenWhere, isValidIndonesianPhone, normalizeEmail, normalizePhone, toProperCase } from "@/lib/format";
import { consentData, PARTNER_CONSENT_REQUIRED_ERROR } from "@/lib/legal";
import { partnerAgreementData } from "@/lib/partner-agreement";
import { clientIp, takeAttempt, RATE_LIMIT_REGISTER_ERROR, REGISTER_STAFF_PER_IP, REGISTER_WINDOW_MS } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/notify";
import { COACH_SPECIALTIES } from "@/lib/coach-specialties";
import { parseCoachBirthDate } from "@/lib/coach-bio";
import { hasPersonalContact, PERSONAL_CONTACT_ERROR } from "@/lib/contact-filter";
import { checkTextFields, INVALID_BODY_ERROR, isPlausibleEmail, isStringArrayOrMissing, MAX_BIO, MAX_EMAIL, MAX_NAME, MAX_NOTE, MAX_PASSWORD, readJsonObject } from "@/lib/register-input";
import { userErrorMessage } from "@/lib/user-error";
import { isCity } from "@/lib/cities";
import { parseRegisterPrices } from "@/lib/pricing";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return Response.json({ error: INVALID_BODY_ERROR }, { status: 400 });
  const shapeError = checkTextFields(body, {
    name: { max: MAX_NAME, label: "Nama" },
    phone: { max: 20, label: "Nomor HP" },
    email: { max: MAX_EMAIL, label: "Email" },
    birthDate: { max: 10, label: "Tanggal lahir" },
    password: { max: MAX_PASSWORD, label: "Password" },
    bio: { max: MAX_BIO, label: "Bio" },
    certificationNote: { max: MAX_NOTE, label: "Catatan sertifikasi" },
    city: { max: 30, label: "Kota" },
  });
  if (shapeError || !isStringArrayOrMissing(body.specialties)) {
    return Response.json({ error: shapeError ?? INVALID_BODY_ERROR }, { status: 400 });
  }
  const {
    name,
    phone: rawPhone,
    email: rawEmail,
    birthDate: rawBirthDate,
    password,
    acceptedTerms,
    bio,
    specialties,
    hasCertification,
    certificationNote,
    city,
    pricePack4,
    pricePack8,
    website,
    formRenderedAt,
  } = body as {
    name?: string;
    phone?: string;
    email?: string;
    birthDate?: string;
    password?: string;
    acceptedTerms?: boolean;
    bio?: string;
    specialties?: string[];
    hasCertification?: boolean;
    certificationNote?: string;
    city?: string;
    pricePack4?: unknown;
    pricePack8?: unknown;
    website?: string;
    formRenderedAt?: number;
  };

  // Anti-spam sama persis pola /api/register (honeypot + minimum waktu isi).
  if (website) {
    return Response.json({ error: "Pendaftaran gagal. Coba lagi." }, { status: 400 });
  }
  if (typeof formRenderedAt === "number" && Date.now() - formRenderedAt < 1500) {
    return Response.json({ error: "Pendaftaran gagal. Tunggu sebentar, lalu kirim lagi." }, { status: 400 });
  }

  if (!name || !rawPhone || !password) {
    return Response.json({ error: "Nama, Nomor HP, dan password wajib diisi." }, { status: 400 });
  }
  if (!isValidIndonesianPhone(rawPhone)) {
    return Response.json({ error: "Format Nomor HP tidak valid (contoh: 0812xxxxxxx)" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  }

  // Tanggal lahir wajib (keputusan Hadi 30 Sep: semua form daftar).
  let birthDate: Date;
  try {
    birthDate = parseCoachBirthDate((rawBirthDate ?? "").trim());
  } catch (err) {
    const message = userErrorMessage(err, "Tanggal lahir tidak valid.");
    return Response.json({ error: rawBirthDate ? message : "Tanggal lahir wajib diisi." }, { status: 400 });
  }

  const cleanSpecialties = (specialties ?? []).filter((s) =>
    (COACH_SPECIALTIES as readonly string[]).includes(s)
  );
  if (cleanSpecialties.length === 0) {
    return Response.json({ error: "Pilih minimal 1 keahlian." }, { status: 400 });
  }

  if (hasPersonalContact(bio) || hasPersonalContact(certificationNote)) {
    return Response.json({ error: PERSONAL_CONTACT_ERROR }, { status: 400 });
  }

  // Kota domisili & harga jasa diisi saat daftar (Hadi 3 Okt).
  if (!isCity(city)) {
    return Response.json({ error: "Pilih kota domisili dari daftar." }, { status: 400 });
  }
  const prices = parseRegisterPrices(pricePack4, pricePack8);
  if ("error" in prices) return Response.json({ error: prices.error }, { status: 400 });

  const consent = consentData(acceptedTerms);
  // Centang yang sama juga menyetujui perjanjian kemitraan bila sudah aktif
  // (Hadi 2 Okt, 3A); {} bila belum aktif.
  const agreement = partnerAgreementData("COACH", acceptedTerms);
  if (!consent || !agreement) {
    return Response.json({ error: PARTNER_CONSENT_REQUIRED_ERROR.COACH }, { status: 400 });
  }

  // Bentuk baku (08xxxxxxxxxx, email huruf kecil) -- lihat /api/register.
  const phone = normalizePhone(rawPhone);
  const email = normalizeEmail(rawEmail);
  if (email && !isPlausibleEmail(email)) {
    return Response.json({ error: "Format email tidak valid." }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({ where: identityTakenWhere(phone, email) });
  if (existing) {
    return Response.json({ error: "Nomor HP atau email sudah terdaftar." }, { status: 409 });
  }

  const registerHit = await takeAttempt(`register-staff:${clientIp(request.headers)}`, REGISTER_STAFF_PER_IP, REGISTER_WINDOW_MS);
  if (!registerHit) {
    return Response.json({ error: RATE_LIMIT_REGISTER_ERROR }, { status: 429 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: toProperCase(name.trim()),
        phone,
        email,
        passwordHash,
        ...consent,
        ...agreement,
        role: "COACH",
        city,
        // Coach yang daftar sendiri gak langsung bisa login/keliatan --
        // nunggu admin approve dulu (toggle isActive di /admin/users).
        // Gak ada vetting kualitas sebelum ini, siapa aja yang isi form
        // langsung bisa buka slot & diliat member.
        isActive: false,
        coachProfile: {
          create: {
            bio: bio?.trim() || null,
            birthDate,
            specialties: cleanSpecialties,
            ...prices,
            hasCertification: !!hasCertification,
            certificationNote: hasCertification ? certificationNote?.trim() || null : null,
          },
        },
      },
      select: { id: true, name: true, phone: true, role: true },
    });

    await notifyAdmins("Pendaftaran coach baru", `${user.name} menunggu persetujuan`, "/admin/users");
    return Response.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return Response.json({ error: "Nomor HP atau email sudah terdaftar." }, { status: 409 });
    }
    throw err;
  }
}
