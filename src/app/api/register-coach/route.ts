import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidIndonesianPhone, toProperCase } from "@/lib/format";
import { COACH_SPECIALTIES } from "@/lib/coach-specialties";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    name,
    phone,
    email,
    password,
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

  if (!name || !phone || !password) {
    return Response.json({ error: "Nama, No HP, dan password wajib diisi" }, { status: 400 });
  }
  if (!isValidIndonesianPhone(phone)) {
    return Response.json({ error: "Format No HP gak valid (contoh: 0812xxxxxxx)" }, { status: 400 });
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

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    return Response.json({ error: "No HP atau email sudah terdaftar" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: toProperCase(name.trim()),
        phone,
        email: email || null,
        passwordHash,
        role: "COACH",
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
