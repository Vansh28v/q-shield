import { NextResponse } from "next/server";

import {
  simulateAttack,
  AttackConfig,
  AttackType,
} from "../../../../lib/quantum/attacks";

import {
  QDSExperimentConfig,
} from "../../../../lib/quantum/simulator";

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

    const result = simulateAttack(
      body.experiment,
      body.attack,
    );

    return NextResponse.json(
      {
        success: true,
        attack: result,
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