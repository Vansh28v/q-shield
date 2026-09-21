import { NextResponse } from "next/server";
import { getRecentEvents } from "../../../lib/security/persistence";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const events = getRecentEvents(limit);
    return NextResponse.json({ success: true, count: events.length, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
