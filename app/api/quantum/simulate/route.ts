import { NextResponse } from "next/server";
import { runQDSExperiment } from "../../../../lib/quantum/simulator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = runQDSExperiment(body);
    return NextResponse.json({ success: true, experiment: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Q-SHIELD Quantum Simulation Service",
    status: "operational",
  });
}
