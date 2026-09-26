import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { verifyPassword } from "@/lib/security/passwords";
import { getUserByEmail, createSession, toPublicUser } from "@/lib/security/persistence";
import { setSessionCookie, sessionExpiry } from "@/lib/security/session";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const user = getUserByEmail(email.trim().toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = randomBytes(32).toString("hex");
  createSession({ token, userId: user.id, expiresAt: sessionExpiry() });
  await setSessionCookie(token);

  return NextResponse.json({ user: toPublicUser(user) }, { status: 200 });
}