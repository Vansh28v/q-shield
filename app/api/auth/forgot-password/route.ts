import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUserByEmail, createPasswordResetToken } from "@/lib/security/persistence";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TTL_MS = 1000 * 60 * 30; // 30 minutes

// Flip this to true once a real email provider (Resend, SES, etc.) is
// wired up. Left false so the app never lies about sending an email.
const EMAIL_DELIVERY_CONFIGURED = false;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const user = getUserByEmail(email.trim().toLowerCase());

  // Generate + persist a token when the account exists, but the response
  // is identical either way so we never reveal whether the email is registered.
  if (user) {
    const token = randomBytes(32).toString("hex");
    createPasswordResetToken({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    });
  }

  return NextResponse.json(
    {
      ok: true,
      delivered: EMAIL_DELIVERY_CONFIGURED,
      message: EMAIL_DELIVERY_CONFIGURED
        ? "If an account exists for this email, recovery instructions have been sent."
        : "Your request was recorded, but email delivery isn't configured yet, so no email was sent.",
    },
    { status: 200 }
  );
}