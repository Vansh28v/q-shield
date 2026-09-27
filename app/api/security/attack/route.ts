import { NextResponse } from "next/server";

import {
  simulateAttack,
  AttackConfig,
  AttackType,
} from "../../../../lib/quantum/attacks";

import {
  QDSExperimentConfig,
} from "../../../../lib/quantum/simulator";

import {
  saveAttackRun,
} from "../../../../lib/security/persistence";

const attackTypes: AttackType[] = [
  "FORGERY",
  "IMPERSONATION",
  "REPLAY",
  "CHANNEL_MANIPULATION",
];

function isObject(
  value: unknown,
): value is Record<string, unknown> {
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
): body is {
  experiment: QDSExperimentConfig;
  attack: AttackConfig;
} {
  if (!isObject(body)) {
    return false;
  }

  const experiment = body.experiment;
  const attack = body.attack;

  if (!isObject(experiment) || !isObject(attack)) {
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

  for (const field of requiredStrings) {
    if (
      typeof experiment[field] !== "string" ||
      experiment[field].trim().length === 0
    ) {
      return false;
    }
  }

  // FIX #2 (IMPERSONATION) — expectedSignerId is optional at the
  // API layer (existing non-impersonation scenarios must keep
  // working without it), but when supplied it must be a
  // non-empty string. simulateAttack() enforces its own stricter
  // requirement (both signerId and expectedSignerId present) for
  // the IMPERSONATION attack type specifically.
  if (experiment.expectedSignerId !== undefined) {
    if (
      typeof experiment.expectedSignerId !== "string" ||
      experiment.expectedSignerId.trim().length === 0
    ) {
      return false;
    }
  }

  if (
    !isFiniteNumber(experiment.alpha) ||
    !isFiniteNumber(experiment.beta) ||
    !isFiniteNumber(experiment.shots) ||
    !isFiniteNumber(experiment.threshold)
  ) {
    return false;
  }

  if (
    experiment.shots <= 0 ||
    !Number.isInteger(experiment.shots)
  ) {
    return false;
  }

  if (
    experiment.threshold < 0 ||
    experiment.threshold > 1
  ) {
    return false;
  }

  if (
    experiment.seed !== undefined &&
    !isFiniteNumber(experiment.seed)
  ) {
    return false;
  }

  if (
    experiment.noise !== undefined
  ) {
    if (!isObject(experiment.noise)) {
      return false;
    }

    if (
      typeof experiment.noise.model !== "string" ||
      !isFiniteNumber(experiment.noise.probability)
    ) {
      return false;
    }

    if (
      experiment.noise.probability < 0 ||
      experiment.noise.probability > 1
    ) {
      return false;
    }
  }

  if (
    typeof attack.type !== "string" ||
    !attackTypes.includes(
      attack.type as AttackType,
    )
  ) {
    return false;
  }

  if (
    !isFiniteNumber(attack.intensity) ||
    attack.intensity < 0 ||
    attack.intensity > 1
  ) {
    return false;
  }

  return true;
}

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();

    if (!validateRequest(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid attack configuration.",
        },
        {
          status: 400,
        },
      );
    }

    // FIX 8 — measure the actual backend execution time of the
    // attack simulation using a high-resolution timer. This does
    // NOT change attack detection logic, replay ledger behavior,
    // or statistical verification — it only wraps the existing
    // simulateAttack call with timing instrumentation.
    const startedAt = performance.now();

    const result = simulateAttack(
      body.experiment,
      body.attack,
    );

    const measuredLatencyMs = performance.now() - startedAt;

    // Merge the measured latency into the existing result shape.
    // All existing fields (detected, riskScore, mechanism, evidence,
    // decision, message, experiment.verification, etc.) are preserved
    // unchanged; only experiment.latencyMs is set from the real
    // measurement instead of being hardcoded or omitted.
    const resultWithLatency = {
      ...result,
      experiment: {
        ...result.experiment,
        latencyMs: measuredLatencyMs,
      },
    };

    saveAttackRun(resultWithLatency);

    return NextResponse.json(
      {
        success: true,
        attack: resultWithLatency,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error.";

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