import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { identityTakenWhere, isValidIndonesianPhone, normalizeEmail, normalizePhone, toProperCase } from "@/lib/format";
import { consentData, CONSENT_REQUIRED_ERROR } from "@/lib/legal";
import { clientIp, takeAttempt, RATE_LIMIT_REGISTER_ERROR, REGISTER_STAFF_PER_IP, REGISTER_WINDOW_MS } from "@/lib/rate-limit";
import { COACH_SPECIALTIES } from "@/lib/coach-specialties";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    name,
    phone: rawPhone,
    email: rawEmail,
    password,
    acceptedTerms,
    bio,
    specialties,
    hasCertification,
    certificationNote,
    website,
    formRenderedAt,
  } = body as {
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    acceptedTerms?: boolean;
    bio?: string;
    specialties?: string[];
    hasCertification?: boolean;
    certificationNote?: string;
    website?: string;
    formRenderedAt?: number;
  };

  // Anti-spam sama persis pola /api/register (honeypot + minimum waktu isi).
  if (website) {
    return Response.json({ error: "Registrasi gagal" }, { status: 400 });
  }
  if (typeof formRenderedAt === "number" && Date.now() - formRenderedAt < 1500) {
    return Response.json({ error: "Registrasi gagal, coba lagi" }, { status: 400 });
  }

  if (!name || !rawPhone || !password) {
    return Response.json({ error: "Nama, No HP, dan password wajib diisi" }, { status: 400 });
  }
  if (!isValidIndonesianPhone(rawPhone)) {
    return Response.json({ error: "Format No HP tidak valid (contoh: 0812xxxxxxx)" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  const cleanSpecialties = (specialties ?? []).filter((s) =>
    (COACH_SPECIALTIES as readonly string[]).includes(s)
  );
  if (cleanSpecialties.length === 0) {
    return Response.json({ error: "Pilih minimal 1 keahlian" }, { status: 400 });
  }

  const consent = consentData(acceptedTerms);
  if (!consent) {
    return Response.json({ error: CONSENT_REQUIRED_ERROR }, { status: 400 });
  }

  // Bentuk baku (08xxxxxxxxxx, email huruf kecil) -- lihat /api/register.
  const phone = normalizePhone(rawPhone);
  const email = normalizeEmail(rawEmail);

  const existing = await prisma.user.findFirst({ where: identityTakenWhere(phone, email) });
  if (existing) {
    return Response.json({ error: "No HP atau email sudah terdaftar" }, { status: 409 });
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
        role: "COACH",
        // Coach yang daftar sendiri gak langsung bisa login/keliatan --
        // nunggu admin approve dulu (toggle isActive di /admin/users).
        // Gak ada vetting kualitas sebelum ini, siapa aja yang isi form
        // langsung bisa buka slot & diliat member.
        isActive: false,
        coachProfile: {
          create: {
            bio: bio?.trim() || null,
            specialties: cleanSpecialties,
            hasCertification: !!hasCertification,
            certificationNote: hasCertification ? certificationNote?.trim() || null : null,
          },
        },
      },
      select: { id: true, name: true, phone: true, role: true },
    });

    return Response.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return Response.json({ error: "No HP atau email sudah terdaftar" }, { status: 409 });
    }
    throw err;
  }
}
