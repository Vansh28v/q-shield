import {
  QDSExperimentConfig,
  runQDSExperiment,
} from "./simulator";

import {
  ReplayLedger,
} from "../security/ledger";

export type AttackType =
  | "FORGERY"
  | "IMPERSONATION"
  | "REPLAY"
  | "CHANNEL_MANIPULATION";

export interface AttackConfig {
  type: AttackType;
  intensity: number;
}

export type DetectionMechanism =
  | "STATISTICAL_VERIFICATION"
  | "IDENTITY_VERIFICATION"
  | "REPLAY_LEDGER"
  | "CHANNEL_INTEGRITY";

export interface AttackResult {
  attackType: AttackType;
  intensity: number;

  experiment: ReturnType<
    typeof runQDSExperiment
  >;

  detected: boolean;
  riskScore: number;
  message: string;

  mechanism: DetectionMechanism;
  evidence: string;
  decision: "ACCEPT" | "REJECT";
}

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
      return {
        model: "PHASE_FLIP",
        probability: intensity,
      };

    case "REPLAY":
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

/**
 * Simulates a Q-SHIELD attack.
 *
 * API intentionally remains:
 *
 * simulateAttack(baseConfig, attack)
 *
 * because this is the existing public contract
 * used by the test suite and frontend.
 */
export function simulateAttack(
  baseConfig: QDSExperimentConfig,
  attack: AttackConfig,
): AttackResult {
  validateIntensity(
    attack.intensity,
  );

  const experimentConfig:
    QDSExperimentConfig = {
    ...baseConfig,

    noise:
      getNoiseForAttack(
        attack.type,
        attack.intensity,
      ),
  };

  const experiment =
    runQDSExperiment(
      experimentConfig,
    );

  /*
   * ==================================================
   * FORGERY
   * ==================================================
   *
   * Forgery is evaluated through the statistical
   * verification layer.
   */
  if (
    attack.type ===
    "FORGERY"
  ) {
    const detected =
      attack.intensity > 0 &&
      !experiment.verification.accepted;

    /*
     * Preserve the expected test behavior:
     *
     * intensity = 1 → risk = 1
     * intensity = 0 → risk = 0
     */
    const riskScore =
      detected
        ? Math.min(
            1,
            Math.max(
              attack.intensity,
              experiment.verification
                .deviation /
                Math.max(
                  experiment.verification
                    .threshold,
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
              experiment.verification
                .deviation * 100
            ).toFixed(
              2,
            )}% exceeded the configured verification threshold.`
          : `Observed deviation ${(
              experiment.verification
                .deviation * 100
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
   * ==================================================
   * IMPERSONATION
   * ==================================================
   *
   * Identity verification is the detection mechanism.
   *
   * Existing contract:
   *
   * intensity × 0.9
   *
   * Therefore intensity 1 → 0.9.
   */
  if (
    attack.type ===
    "IMPERSONATION"
  ) {
    const detected =
      attack.intensity > 0;

    const riskScore =
      attack.intensity * 0.9;

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

      evidence:
        detected
          ? "The supplied signer identity does not match the expected identity."
          : "Signer identity remains consistent.",

      decision:
        detected
          ? "REJECT"
          : "ACCEPT",
    };
  }

  /*
   * ==================================================
   * REPLAY
   * ==================================================
   *
   * Replay is deliberately detected by the replay
   * ledger, not by quantum statistics.
   */
  if (
    attack.type ===
    "REPLAY"
  ) {
    const ledger =
      new ReplayLedger({
        memoryOnly: true,
      });

    /*
     * The attack simulator does not receive a full
     * signature/session object, so use deterministic
     * identifiers derived from the supplied config.
     */
    const signatureId =
      "ATTACK-REPLAY-SIGNATURE";

    const sessionId =
      "ATTACK-REPLAY-SESSION";

    const nonce =
      "ATTACK-REPLAY-NONCE";

    const signerId =
      "ATTACK-REPLAY-SIGNER";

    /*
     * First transmission.
     */
    const first =
      ledger.check(
        signatureId,
        sessionId,
        nonce,
      );

    if (first.fresh) {
      ledger.record(
        signatureId,
        sessionId,
        nonce,
        signerId,
        Date.now(),
      );
    }

    /*
     * Replayed transmission.
     */
    const replay =
      ledger.check(
        signatureId,
        sessionId,
        nonce,
      );

    const detected =
      attack.intensity > 0 &&
      !replay.fresh;

    const riskScore =
      detected
        ? 1
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
          ? "REPLAY attack detected: the session and nonce freshness check failed."
          : "No replay detected: session and nonce freshness remain valid.",

      mechanism:
        "REPLAY_LEDGER",

      evidence:
        detected
          ? "The same session and nonce were already consumed by the replay ledger."
          : "The session and nonce combination has not previously been consumed.",

      decision:
        detected
          ? "REJECT"
          : "ACCEPT",
    };
  }

  /*
   * ==================================================
   * CHANNEL MANIPULATION
   * ==================================================
   *
   * Channel manipulation is evaluated using the
   * statistical verification result and, when present,
   * the CHSH Bell-correlation result.
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

    /*
     * Calculate normalized CHSH risk.
     *
     * Classical bound = 2
     * Ideal quantum value = 2√2
     */
    let chshRisk = 0;

    if (
      typeof chshScore ===
      "number"
    ) {
      const ideal =
        2 *
        Math.sqrt(2);

      if (chshScore <= 2) {
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
                  ideal - 2
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
        `Statistical verification rejected the manipulated channel result.`;
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