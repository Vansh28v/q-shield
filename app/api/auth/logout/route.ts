import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/security/persistence";
import { SESSION_COOKIE_NAME, clearSessionCookie } from "@/lib/security/session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    deleteSession(token);
  }

  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}