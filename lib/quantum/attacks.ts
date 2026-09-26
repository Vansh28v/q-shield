import {
  QDSExperimentConfig,
  runQDSExperiment,
} from "./simulator";

import {
  ReplayLedger,
  LedgerCheckResult,
} from "../security/ledger";

export type AttackType =
  | "FORGERY"
  | "IMPERSONATION"
  | "REPLAY"
  | "CHANNEL_MANIPULATION";

export type AttackConfig = {
  type: AttackType;
  intensity: number;
};

export type DetectionMechanism =
  | "STATISTICAL_VERIFICATION"
  | "IDENTITY_VERIFICATION"
  | "REPLAY_LEDGER"
  | "CHANNEL_INTEGRITY";

export type AttackResult = {
  attackType: AttackType;
  intensity: number;
  experiment: ReturnType<typeof runQDSExperiment>;
  detected: boolean;
  riskScore: number;
  message: string;
  mechanism: DetectionMechanism;
  evidence: string;
  decision: "ACCEPT" | "REJECT";
};

/*
 * Persistent replay ledger.
 *
 * This is intentionally created once at module scope so that
 * separate simulateAttack() calls can observe transactions
 * consumed by earlier calls.
 */
const replayLedger = new ReplayLedger();

function validateIntensity(
  intensity: number,
): void {
  if (!Number.isFinite(intensity)) {
    throw new Error(
      "Attack intensity must be finite.",
    );
  }

  if (intensity < 0) {
    throw new Error(
      "Attack intensity cannot be negative.",
    );
  }

  if (intensity > 1) {
    throw new Error(
      "Attack intensity cannot exceed 1.",
    );
  }
}

function getNoiseForAttack(
  type: AttackType,
  intensity: number,
): QDSExperimentConfig["noise"] {
  switch (type) {
    case "FORGERY":
      return {
        model: "BIT_FLIP",
        probability: intensity,
      };

    case "IMPERSONATION":
      /*
       * Impersonation is an identity/authentication problem,
       * not a quantum-channel noise problem.
       */
      return {
        model: "NONE",
        probability: 0,
      };

    case "REPLAY":
      /*
       * Replay is a freshness/session problem.
       * It must not inject quantum noise.
       */
      return {
        model: "NONE",
        probability: 0,
      };

    case "CHANNEL_MANIPULATION":
      return {
        model: "DEPOLARIZING",
        probability: intensity,
      };

    default:
      throw new Error(
        `Unsupported attack type: ${type}`,
      );
  }
}

function formatLedgerTimestamp(
  value: number,
): string {
  try {
    return new Date(value).toISOString();
  } catch {
    return String(value);
  }
}

function describeReplayEvidence(
  check: LedgerCheckResult,
): string {
  const record = check.record;

  switch (check.reason) {
    case "EXACT_TRANSACTION_ALREADY_SEEN":
      if (record) {
        return (
          `The exact transaction tuple ` +
          `(signature "${record.signatureId}", ` +
          `session "${record.sessionId}", ` +
          `nonce "${record.nonce}") was already consumed ` +
          `by the replay ledger at ` +
          `${formatLedgerTimestamp(record.createdAt)}. ` +
          `Resubmitting the same transaction was rejected as a replay.`
        );
      }

      return (
        "The exact signature/session/nonce transaction was already " +
        "consumed by the replay ledger."
      );

    case "SIGNATURE_ALREADY_SEEN":
      if (record) {
        return (
          `Signature "${record.signatureId}" was already recorded by ` +
          `the replay ledger at ${formatLedgerTimestamp(record.createdAt)} ` +
          `(session "${record.sessionId}", nonce "${record.nonce}"). ` +
          `Resubmitting the same signature was rejected as a replay.`
        );
      }

      return (
        "This signature was already recorded by the replay ledger. " +
        "Resubmitting it was rejected as a replay."
      );

    case "SESSION_NONCE_ALREADY_SEEN":
      if (record) {
        return (
          `The session "${record.sessionId}" and nonce "${record.nonce}" ` +
          `combination was already consumed by the replay ledger at ` +
          `${formatLedgerTimestamp(record.createdAt)}. ` +
          "Resubmitting the same session/nonce pair was rejected as a replay."
        );
      }

      return (
        "This session and nonce combination was already consumed by " +
        "the replay ledger. Resubmitting it was rejected as a replay."
      );

    case "NONCE_ALREADY_SEEN":
      if (record) {
        return (
          `Nonce "${record.nonce}" was already consumed by the replay ledger ` +
          `at ${formatLedgerTimestamp(record.createdAt)}. ` +
          "Reusing the same nonce was rejected as a replay."
        );
      }

      return (
        "This nonce was already consumed by the replay ledger. " +
        "Reusing it was rejected as a replay."
      );

    default:
      return (
        "The submitted transaction was already consumed by " +
        "the replay ledger."
      );
  }
}

/**
 * Simulate a Q-SHIELD security attack.
 *
 * Attack mechanisms:
 *
 * FORGERY
 *   -> statistical verification
 *
 * IMPERSONATION
 *   -> signer identity comparison
 *
 * REPLAY
 *   -> exact persistent transaction ledger
 *
 * CHANNEL_MANIPULATION
 *   -> statistical verification + CHSH channel integrity
 */
export function simulateAttack(
  baseConfig: QDSExperimentConfig,
  attack: AttackConfig,
): AttackResult {
  validateIntensity(
    attack.intensity,
  );

  const noise =
    getNoiseForAttack(
      attack.type,
      attack.intensity,
    );

  const experiment =
    runQDSExperiment({
      ...baseConfig,
      noise,
    });

  /*
   * ============================================================
   * FORGERY
   * ============================================================
   */

  if (
    attack.type ===
    "FORGERY"
  ) {
    const detected =
      attack.intensity > 0 &&
      !experiment.verification.accepted;

    const riskScore =
      detected
        ? Math.min(
            1,
            Math.max(
              attack.intensity,
              experiment.verification.deviation /
                Math.max(
                  experiment.verification.threshold,
                  Number.EPSILON,
                ),
            ),
          )
        : attack.intensity;

    return {
      attackType:
        attack.type,

      intensity:
        attack.intensity,

      experiment,

      detected,

      riskScore,

      message:
        detected
          ? "FORGERY attack detected: statistical verification rejected the altered signature."
          : "No FORGERY attack detected.",

      mechanism:
        "STATISTICAL_VERIFICATION",

      evidence:
        detected
          ? `Observed deviation ${(
              experiment.verification.deviation * 100
            ).toFixed(
              2,
            )}% exceeded the configured verification threshold.`
          : `Observed deviation ${(
              experiment.verification.deviation * 100
            ).toFixed(
              2,
            )}% remained within the configured verification threshold.`,

      decision:
        detected
          ? "REJECT"
          : "ACCEPT",
    };
  }

  /*
   * ============================================================
   * IMPERSONATION
   * ============================================================
   */

  if (
    attack.type ===
    "IMPERSONATION"
  ) {
    const {
      signerId,
      expectedSignerId,
    } = baseConfig;

    if (
      !signerId ||
      !signerId.trim() ||
      !expectedSignerId ||
      !expectedSignerId.trim()
    ) {
      throw new Error(
        "Impersonation detection requires signerId and expectedSignerId.",
      );
    }

    const detected =
      signerId !== expectedSignerId;

    const riskScore =
      detected
        ? 1
        : 0;

    const evidence =
      detected
        ? `Claimed signer identity "${signerId}" does not match expected signer identity "${expectedSignerId}".`
        : `Claimed signer identity "${signerId}" matches the expected signer identity.`;

    return {
      attackType:
        attack.type,

      intensity:
        attack.intensity,

      experiment,

      detected,

      riskScore,

      message:
        detected
          ? "IMPERSONATION attack detected: signer identity verification failed."
          : "No impersonation detected.",

      mechanism:
        "IDENTITY_VERIFICATION",

      evidence,

      decision:
        detected
          ? "REJECT"
          : "ACCEPT",
    };
  }

  /*
   * ============================================================
   * REPLAY
   * ============================================================
   *
   * IMPORTANT:
   *
   * Replay detection uses the EXACT transaction tuple:
   *
   *   signatureId + sessionId + nonce
   *
   * Therefore:
   *
   *   same signature + different nonce
   *       -> fresh
   *
   *   same nonce + different session
   *       -> fresh
   *
   *   same session + nonce + different signature
   *       -> fresh
   *
   *   exact same tuple
   *       -> replay
   */

  if (
    attack.type ===
    "REPLAY"
  ) {
    const {
      signatureId,
      sessionId,
      nonce,
      signerId,
    } = baseConfig;

    if (
      !signatureId ||
      !signatureId.trim()
    ) {
      throw new Error(
        "Replay detection requires a non-empty signatureId.",
      );
    }

    if (
      !sessionId ||
      !sessionId.trim()
    ) {
      throw new Error(
        "Replay detection requires a non-empty sessionId.",
      );
    }

    if (
      !nonce ||
      !nonce.trim()
    ) {
      throw new Error(
        "Replay detection requires a non-empty nonce.",
      );
    }

    if (
      !signerId ||
      !signerId.trim()
    ) {
      throw new Error(
        "Replay detection requires a non-empty signerId.",
      );
    }

    /*
     * Use the exact replay ledger rather than the broader
     * freshness ledger.
     */
    const check =
      replayLedger.checkExact(
        signatureId,
        sessionId,
        nonce,
      );

    if (
      check.fresh
    ) {
      replayLedger.recordExact(
        signatureId,
        sessionId,
        nonce,
        signerId,
        Date.now(),
      );

      return {
        attackType:
          attack.type,

        intensity:
          attack.intensity,

        experiment,

        detected:
          false,

        riskScore:
          0,

        message:
          "No replay detected: exact signature/session/nonce transaction was fresh.",

        mechanism:
          "REPLAY_LEDGER",

        evidence:
          `The exact transaction tuple (signature "${signatureId}", session "${sessionId}", nonce "${nonce}") was not previously recorded. It has now been consumed by the replay ledger.`,

        decision:
          "ACCEPT",
      };
    }

    return {
      attackType:
        attack.type,

      intensity:
        attack.intensity,

      experiment,

      detected:
        true,

      riskScore:
        1,

      message:
  "REPLAY attack detected: session and nonce freshness validation failed because the exact signature/session/nonce transaction was already consumed.",
      mechanism:
        "REPLAY_LEDGER",

      evidence:
        describeReplayEvidence(
          check,
        ),

      decision:
        "REJECT",
    };
  }

  /*
   * ============================================================
   * CHANNEL MANIPULATION
   * ============================================================
   */

  if (
    attack.type ===
    "CHANNEL_MANIPULATION"
  ) {
    const statisticalFailure =
      !experiment.verification.accepted;

    const chshScore =
      experiment.chsh?.S;

    const chshFailure =
      typeof chshScore ===
        "number" &&
      chshScore <= 2;

    const detected =
      attack.intensity > 0 &&
      (
        statisticalFailure ||
        chshFailure
      );

    let chshRisk = 0;

    if (
      typeof chshScore ===
      "number"
    ) {
      const ideal =
        2 *
        Math.sqrt(2);

      if (
        chshScore <= 2
      ) {
        chshRisk = 1;
      } else {
        chshRisk =
          Math.max(
            0,
            Math.min(
              1,
              (
                ideal -
                chshScore
              ) /
              (
                ideal -
                2
              ),
            ),
          );
      }
    }

    const statisticalRisk =
      statisticalFailure
        ? 1
        : 0;

    const riskScore =
      detected
        ? Math.min(
            1,
            Math.max(
              attack.intensity,
              statisticalRisk,
              chshRisk,
            ),
          )
        : attack.intensity;

    let evidence =
      "Channel integrity remained within the simulated verification bounds.";

    if (
      chshFailure &&
      statisticalFailure
    ) {
      evidence =
        `CHSH correlation degraded to S=${chshScore!.toFixed(
          4,
        )}, at or below the classical bound of 2, and statistical verification rejected the result.`;
    } else if (
      chshFailure
    ) {
      evidence =
        `CHSH correlation degraded to S=${chshScore!.toFixed(
          4,
        )}, at or below the classical bound of 2.`;
    } else if (
      statisticalFailure
    ) {
      evidence =
        "Statistical verification rejected the manipulated channel result.";
    }

    return {
      attackType:
        attack.type,

      intensity:
        attack.intensity,

      experiment,

      detected,

      riskScore,

      message:
        detected
          ? "CHANNEL_MANIPULATION attack detected: quantum channel integrity was degraded."
          : "No channel manipulation detected.",

      mechanism:
        "CHANNEL_INTEGRITY",

      evidence,

      decision:
        detected
          ? "REJECT"
          : "ACCEPT",
    };
  }

  throw new Error(
    `Unsupported attack type: ${attack.type}`,
  );
}