import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "qshield_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/quantum",
  "/signature",
  "/attack-lab",
  "/intelligence",
  "/analytics",
  "/events",
];

// NOTE: better-sqlite3 uses native bindings and cannot run in the Edge
// middleware runtime, so this only checks that a session cookie is
// present (a fast, coarse gate). It does NOT verify the session is still
// valid in the database. Add a `getCurrentUser()` call (from
// lib/security/session.ts) inside each protected page/layout for full
// server-side verification — those page files weren't provided to me,
// so I couldn't wire that part in.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quantum/:path*",
    "/signature/:path*",
    "/attack-lab/:path*",
    "/intelligence/:path*",
    "/analytics/:path*",
    "/events/:path*",
  ],
};