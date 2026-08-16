import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, phone, email, password } = body as {
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
  };

  if (!name || !phone || !password) {
    return Response.json(
      { error: "Nama, No HP, dan password wajib diisi" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return Response.json(
      { error: "Password minimal 8 karakter" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    return Response.json(
      { error: "No HP atau email sudah terdaftar" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: { name, phone, email: email || null, passwordHash, role: "MEMBER" },
      select: { id: true, name: true, email: true, phone: true, role: true },
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
