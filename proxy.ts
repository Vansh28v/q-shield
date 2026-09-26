import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
 * Q-SHIELD request-level route protection.
 *
 * Next.js 16 replaces middleware.ts with proxy.ts (same location,
 * function renamed from `middleware` to `proxy`, runs on the
 * Node.js runtime). Logic is otherwise unchanged from the
 * middleware convention.
 *
 * This file performs ONLY a cookie-presence gate. It does not
 * validate the session against SQLite or any other store — that
 * stays in the existing auth architecture (API routes / server
 * components), exactly as before. This is intentionally shallow:
 * presence of qshield_session is enough to let the request through
 * to the page, which is then responsible for its own deeper
 * verification if it needs any.
 */

const PROTECTED_PATHS = [
  "/dashboard",
  "/quantum",
  "/signature",
  "/attack-lab",
  "/intelligence",
  "/analytics",
  "/events",
];

const SESSION_COOKIE_NAME = "qshield_session";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (protectedPath) =>
      pathname === protectedPath ||
      pathname.startsWith(`${protectedPath}/`),
  );
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

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