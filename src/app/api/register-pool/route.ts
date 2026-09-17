import { POOL_FACILITIES } from "@/lib/pool-facilities";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidIndonesianPhone, toProperCase } from "@/lib/format";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    ownerName,
    phone,
    email,
    password,
    poolName,
    address,
    openTime,
    closeTime,
    description,
    facilities,
    website,
    formRenderedAt,
  } = body as {
    ownerName?: string;
    phone?: string;
    email?: string;
    password?: string;
    poolName?: string;
    address?: string;
    openTime?: string;
    closeTime?: string;
    description?: string;
    facilities?: string[];
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

  if (!ownerName || !phone || !password || !poolName || !address || !openTime || !closeTime) {
    return Response.json(
      { error: "Semua field wajib diisi (nama pemilik, No HP, password, nama kolam, alamat, jam buka & tutup)" },
      { status: 400 }
    );
  }
  if (!isValidIndonesianPhone(phone)) {
    return Response.json({ error: "Format No HP tidak valid (contoh: 0812xxxxxxx)" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }
  // Form udah validasi closeTime > openTime di client, tapi request API
  // bisa dipalsu langsung (bukan cuma dropdown UI) -- validasi ulang di
  // sini, sama pola kayak affiliasi coach di addAvailability.
  if (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime)) {
    return Response.json({ error: "Format jam buka/tutup tidak valid" }, { status: 400 });
  }
  if (closeTime <= openTime) {
    return Response.json({ error: "Jam tutup harus setelah jam buka" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    return Response.json({ error: "No HP atau email sudah terdaftar" }, { status: 409 });
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
          email: email || null,
          passwordHash,
          role: "POOL_OWNER",
          isActive: false,
        },
      });
      const pool = await tx.pool.create({
        data: {
          name: poolName.trim(),
          address: address.trim(),
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

    return Response.json(
      { user: { id: result.user.id, name: result.user.name, phone: result.user.phone } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return Response.json({ error: "No HP atau email sudah terdaftar" }, { status: 409 });
    }
    throw err;
  }
}
