import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (req.auth.user.mustChangePassword && pathname !== "/ganti-password") {
    return NextResponse.redirect(new URL("/ganti-password", req.nextUrl));
  }

  // Admin wajib memasang 2FA dulu (halaman /keamanan, di luar matcher ini).
  if (role === "ADMIN" && req.auth.user.needsTotpSetup) {
    return NextResponse.redirect(new URL("/keamanan", req.nextUrl));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (pathname.startsWith("/coach") && role !== "COACH") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (pathname.startsWith("/member") && role !== "MEMBER") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (pathname.startsWith("/pool") && role !== "POOL_OWNER") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Sesi udah diverifikasi (termasuk cek isActive terbaru) di atas -- oper
  // hasilnya lewat header biar layout/page gak perlu jalanin auth() ulang
  // (yang query DB lagi) buat ngecek hal yang udah pasti sama.
  //
  // name/email di-encodeURIComponent dulu -- HTTP header value cuma
  // nerima Latin-1 (0-255), dan `name` bisa diisi user bebas (form Edit
  // Profil gak batasin karakter). Tanpa encode, siapapun yang masukin
  // emoji/karakter di luar Latin-1 ke namanya bikin `Headers.set` throw
  // (dibuktiin langsung: `new Headers().set("x","😀")` throw
  // "has a value of 55357 which is greater than 255") -- middleware
  // crash total buat SEMUA request akun itu ke /admin, /coach, /member,
  // /pool, ngunci diri sendiri dari seluruh app. decodeURIComponent
  // pasangannya ada di require-role.ts.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-session-user-id", req.auth.user.id);
  requestHeaders.set("x-session-user-role", req.auth.user.role);
  requestHeaders.set("x-session-user-name", encodeURIComponent(req.auth.user.name ?? ""));
  requestHeaders.set("x-session-user-email", encodeURIComponent(req.auth.user.email ?? ""));
  requestHeaders.set(
    "x-session-must-change-password",
    String(req.auth.user.mustChangePassword),
  );

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/member/:path*", "/coach/:path*", "/admin/:path*", "/pool/:path*", "/api/admin/:path*"],
};
