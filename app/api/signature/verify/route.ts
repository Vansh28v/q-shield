import { NextResponse } from "next/server";
import { verifyQDSSignature } from "../../../../lib/security/signature";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signature, expectedMessage, expectedSignerId, options } = body;

    if (!signature || !expectedMessage || !expectedSignerId) {
      return NextResponse.json(
        { success: false, error: "signature, expectedMessage, and expectedSignerId are required." },
        { status: 400 },
      );
    }

    const verification = verifyQDSSignature(
      signature,
      expectedMessage,
      expectedSignerId,
      options,
    );

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Q-SHIELD QDS Verification Service",
    status: "operational",
  });
}
