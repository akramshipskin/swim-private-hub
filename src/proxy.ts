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
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-session-user-id", req.auth.user.id);
  requestHeaders.set("x-session-user-role", req.auth.user.role);
  requestHeaders.set("x-session-user-name", req.auth.user.name ?? "");
  requestHeaders.set("x-session-user-email", req.auth.user.email ?? "");
  requestHeaders.set(
    "x-session-must-change-password",
    String(req.auth.user.mustChangePassword),
  );

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/member/:path*", "/coach/:path*", "/admin/:path*", "/pool/:path*", "/api/admin/:path*"],
};
