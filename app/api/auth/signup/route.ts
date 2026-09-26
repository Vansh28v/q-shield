import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { hashPassword } from "@/lib/security/passwords";
import {
  createUser,
  getUserByEmail,
  createSession,
  toPublicUser,
} from "@/lib/security/persistence";
import { setSessionCookie, sessionExpiry } from "@/lib/security/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, password, confirmPassword } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (getUserByEmail(normalizedEmail)) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  let user;

  try {
    user = createUser({
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    });
  } catch {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const token = randomBytes(32).toString("hex");
  createSession({ token, userId: user.id, expiresAt: sessionExpiry() });
  await setSessionCookie(token);

  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}