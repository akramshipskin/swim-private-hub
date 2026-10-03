import { POOL_FACILITIES } from "@/lib/pool-facilities";
import { isCity } from "@/lib/cities";
import { parseDailyCapacity, parseRegisterPrices } from "@/lib/pricing";
import bcrypt from "bcryptjs";
import { notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { identityTakenWhere, isValidIndonesianPhone, normalizeEmail, normalizePhone, toProperCase } from "@/lib/format";
import { consentData, PARTNER_CONSENT_REQUIRED_ERROR } from "@/lib/legal";
import { partnerAgreementData } from "@/lib/partner-agreement";
import { clientIp, takeAttempt, RATE_LIMIT_REGISTER_ERROR, REGISTER_STAFF_PER_IP, REGISTER_WINDOW_MS } from "@/lib/rate-limit";
import { checkTextFields, INVALID_BODY_ERROR, isPlausibleEmail, isStringArrayOrMissing, MAX_ADDRESS, MAX_EMAIL, MAX_NAME, MAX_PASSWORD, MAX_POOL_NAME, readJsonObject } from "@/lib/register-input";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return Response.json({ error: INVALID_BODY_ERROR }, { status: 400 });
  const shapeError = checkTextFields(body, {
    ownerName: { max: MAX_NAME, label: "Nama pemilik" },
    phone: { max: 20, label: "Nomor HP" },
    email: { max: MAX_EMAIL, label: "Email" },
    password: { max: MAX_PASSWORD, label: "Password" },
    poolName: { max: MAX_POOL_NAME, label: "Nama kolam" },
    address: { max: MAX_ADDRESS, label: "Alamat" },
    openTime: { max: 5, label: "Jam buka" },
    closeTime: { max: 5, label: "Jam tutup" },
    city: { max: 30, label: "Kota" },
  });
  if (shapeError || !isStringArrayOrMissing(body.facilities) || (body.description != null && typeof body.description !== "string")) {
    return Response.json({ error: shapeError ?? INVALID_BODY_ERROR }, { status: 400 });
  }
  const {
    ownerName,
    phone: rawPhone,
    email: rawEmail,
    password,
    acceptedTerms,
    poolName,
    address,
    openTime,
    closeTime,
    description,
    facilities,
    city,
    pricePack4,
    pricePack8,
    dailyCapacity,
    website,
    formRenderedAt,
  } = body as {
    ownerName?: string;
    phone?: string;
    email?: string;
    password?: string;
    acceptedTerms?: boolean;
    poolName?: string;
    address?: string;
    openTime?: string;
    closeTime?: string;
    description?: string;
    facilities?: string[];
    city?: string;
    pricePack4?: unknown;
    pricePack8?: unknown;
    dailyCapacity?: unknown;
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

  if (!ownerName || !rawPhone || !password || !poolName || !address || !openTime || !closeTime) {
    return Response.json(
      { error: "Semua kolom wajib diisi: nama pemilik, Nomor HP, password, nama kolam, alamat, jam buka, dan jam tutup." },
      { status: 400 }
    );
  }
  if (!isValidIndonesianPhone(rawPhone)) {
    return Response.json({ error: "Format Nomor HP tidak valid (contoh: 0812xxxxxxx)" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  }
  // Form udah validasi closeTime > openTime di client, tapi request API
  // bisa dipalsu langsung (bukan cuma dropdown UI) -- validasi ulang di
  // sini, sama pola kayak affiliasi coach di addAvailability.
  if (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime)) {
    return Response.json({ error: "Format jam buka atau jam tutup tidak valid. Pilih ulang jamnya." }, { status: 400 });
  }
  if (closeTime <= openTime) {
    return Response.json({ error: "Jam tutup harus setelah jam buka." }, { status: 400 });
  }
  // Kota, harga paket, dan kapasitas harian diisi saat daftar (Hadi 3 Okt).
  if (!isCity(city)) {
    return Response.json({ error: "Pilih kota kolam dari daftar." }, { status: 400 });
  }
  const prices = parseRegisterPrices(pricePack4, pricePack8);
  if ("error" in prices) return Response.json({ error: prices.error }, { status: 400 });
  const capacity = parseDailyCapacity(dailyCapacity);
  if (typeof capacity !== "number") return Response.json({ error: capacity.error }, { status: 400 });

  const consent = consentData(acceptedTerms);
  // Centang yang sama juga menyetujui MOU kolam bila sudah aktif
  // (Hadi 2 Okt, 3A); {} bila belum aktif.
  const agreement = partnerAgreementData("POOL_OWNER", acceptedTerms);
  if (!consent || !agreement) {
    return Response.json({ error: PARTNER_CONSENT_REQUIRED_ERROR.POOL_OWNER }, { status: 400 });
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
    const result = await prisma.$transaction(async (tx) => {
      // Owner & kolam yang daftar sendiri gak langsung aktif -- nunggu
      // admin approve dulu (toggle isActive di /admin/users buat owner,
      // /admin/kolam buat kolamnya). Kolam yang belum aktif otomatis gak
      // keliatan di dropdown booking member (member/booking/page.tsx
      // filter isActive:true), jadi gak bisa nerima booking sebelum
      // di-review.
      const user = await tx.user.create({
        data: {
          name: toProperCase(ownerName.trim()),
          phone,
          email,
          passwordHash,
          ...consent,
          ...agreement,
          role: "POOL_OWNER",
          isActive: false,
        },
      });
      const pool = await tx.pool.create({
        data: {
          name: toProperCase(poolName.trim()),
          address: address.trim(),
          city,
          ...prices,
          dailyCapacity: capacity,
          contactPhone: phone,
          openTime,
          closeTime,
          description: description?.trim().slice(0, 1000) || null,
          facilities: (facilities ?? []).filter((f) => (POOL_FACILITIES as readonly string[]).includes(f)),
          isActive: false,
          ownerships: { create: { ownerId: user.id } },
        },
      });
      return { user, pool };
    });

    await notifyAdmins("Pendaftaran kolam baru", `${result.pool.name} (${result.user.name}) menunggu persetujuan`, "/admin/users");
    return Response.json(
      { user: { id: result.user.id, name: result.user.name, phone: result.user.phone } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return Response.json({ error: "Nomor HP atau email sudah terdaftar." }, { status: 409 });
    }
    throw err;
  }
}
