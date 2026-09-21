import {
  NextResponse,
} from "next/server";

import {
  runSecurityExperiment,
  SecurityExperimentConfig,
} from "../../../../lib/security/experiment";

import {
  ReplayLedger,
} from "../../../../lib/security/ledger";

import {
  createExperimentTelemetry,
} from "../../../../lib/security/telemetry";

import {
  saveExperimentRecord,
  saveSecurityEvent,
} from "../../../../lib/security/persistence";
/*
 * One in-memory ledger for the running application.
 *
 * This allows replay detection across requests while
 * the server process remains alive.
 *
 * This is prototype storage, not production persistence.
 */
const ledger =
  new ReplayLedger();

function isObject(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function validateRequest(
  body: unknown,
): body is SecurityExperimentConfig {
  if (!isObject(body)) {
    return false;
  }

  const requiredStrings = [
    "experimentId",
    "sessionId",
    "signatureId",
    "signerId",
    "message",
    "nonce",
  ];

  for (
    const field of requiredStrings
  ) {
    if (
      typeof body[field] !==
        "string" ||
      body[field].trim().length === 0
    ) {
      return false;
    }
  }

  if (
    !isFiniteNumber(body.alpha) ||
    !isFiniteNumber(body.beta) ||
    !isFiniteNumber(body.shots) ||
    !isFiniteNumber(body.threshold)
  ) {
    return false;
  }

  if (
    body.shots <= 0 ||
    !Number.isInteger(body.shots)
  ) {
    return false;
  }

  if (
    body.threshold < 0 ||
    body.threshold > 1
  ) {
    return false;
  }

  if (
    body.seed !== undefined &&
    !isFiniteNumber(body.seed)
  ) {
    return false;
  }

  if (
    body.createdAt !== undefined &&
    !isFiniteNumber(body.createdAt)
  ) {
    return false;
  }

  if (
    body.expectedSignerId !== undefined &&
    typeof body.expectedSignerId !==
      "string"
  ) {
    return false;
  }

  if (
    body.expectedMessage !== undefined &&
    typeof body.expectedMessage !==
      "string"
  ) {
    return false;
  }

  if (
    body.unauthorizedVerification !==
      undefined &&
    typeof body.unauthorizedVerification !==
      "boolean"
  ) {
    return false;
  }

  if (
    body.noise !== undefined
  ) {
    if (
      !isObject(body.noise)
    ) {
      return false;
    }

    if (
      typeof body.noise.model !==
        "string" ||
      !isFiniteNumber(
        body.noise.probability,
      )
    ) {
      return false;
    }

    if (
      body.noise.probability < 0 ||
      body.noise.probability > 1
    ) {
      return false;
    }
  }

  return true;
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    if (
      !validateRequest(body)
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid experiment configuration.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      runSecurityExperiment(
        body,
        ledger,
      );

    const telemetry =
      createExperimentTelemetry(
        result,
      );

    saveExperimentRecord(result);
    saveSecurityEvent(telemetry.event);

    return NextResponse.json(
      {
        success: true,

        experiment: result,

        event:
          telemetry.event,

        telemetry:
          telemetry.telemetry,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * Simple API status endpoint.
 */
export async function GET() {
  return NextResponse.json({
    service:
      "Q-SHIELD Security Engine",

    status:
      "operational",

    engine:
      "deterministic",

    aiAdvisory:
      "optional",

    replayLedgerSize:
      ledger.size(),
  });
}