import { NextResponse } from "next/server";
import { simulateAttack } from "../../../../lib/quantum/attacks";
import { saveAttackRun } from "../../../../lib/security/persistence";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { experiment, attack } = body;

    if (!experiment || !attack) {
      return NextResponse.json(
        { success: false, error: "experiment and attack parameters are required." },
        { status: 400 },
      );
    }

    const result = simulateAttack(experiment, attack);
    saveAttackRun(result);

    return NextResponse.json({ success: true, attack: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Q-SHIELD Attack Simulation Service",
    status: "operational",
  });
}
