import { cookies } from "next/headers";
import { getSessionUser, type PublicUser } from "./persistence";

export const SESSION_COOKIE_NAME = "qshield_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString();
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Call this from server components / route handlers that need to know
// who's logged in. Returns null when there's no valid session.
export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  return getSessionUser(token);
}