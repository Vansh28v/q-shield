import {
  AttackType,
} from "../quantum/attacks";

import {
  VerificationResult,
} from "../quantum/verification";

import {
  CHSHResult,
} from "../quantum/chsh";

export type ThreatLevel =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ThreatDetectorInput = {
  verification: VerificationResult;

  chsh?: CHSHResult;

  replayDetected?: boolean;

  attackType?: AttackType;

  unauthorizedVerification?: boolean;
};

export type ThreatDetectorResult = {
  detected: boolean;

  threatLevel: ThreatLevel;

  threatType:
    | AttackType
    | "UNAUTHORIZED_VERIFICATION"
    | "QUANTUM_CHANNEL_ANOMALY"
    | "STATISTICAL_ANOMALY"
    | "NONE";

  riskScore: number;

  reasons: string[];

  recommendedAction:
    | "ALLOW"
    | "MONITOR"
    | "REJECT"
    | "BLOCK";
};

/**
 * Clamp a risk score to [0, 1].
 */
function clampRisk(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(1, value),
  );
}

/**
 * Determine threat severity from risk score.
 */
function getThreatLevel(
  riskScore: number,
): ThreatLevel {
  if (riskScore <= 0) {
    return "NONE";
  }

  if (riskScore < 0.25) {
    return "LOW";
  }

  if (riskScore < 0.5) {
    return "MEDIUM";
  }

  if (riskScore < 0.75) {
    return "HIGH";
  }

  return "CRITICAL";
}

/**
 * Deterministic Q-SHIELD threat detector.
 *
 * This layer does NOT use AI/ML.
 *
 * It combines:
 *
 * - statistical verification
 * - CHSH evidence
 * - replay detection
 * - attack context
 * - unauthorized verification attempts
 */
export function detectThreat(
  input: ThreatDetectorInput,
): ThreatDetectorResult {
  const reasons: string[] = [];

  let riskScore = 0;

  let threatType:
    | AttackType
    | "UNAUTHORIZED_VERIFICATION"
    | "QUANTUM_CHANNEL_ANOMALY"
    | "STATISTICAL_ANOMALY"
    | "NONE" = "NONE";

  /*
   * --------------------------------------------------
   * 1. Replay detection
   * --------------------------------------------------
   */

  if (input.replayDetected) {
    riskScore = Math.max(
      riskScore,
      1,
    );

    threatType = "REPLAY";

    reasons.push(
      "Previously observed session or nonce detected.",
    );
  }

  /*
   * --------------------------------------------------
   * 2. Unauthorized verification
   * --------------------------------------------------
   */

  if (input.unauthorizedVerification) {
    riskScore = Math.max(
      riskScore,
      0.9,
    );

    if (threatType === "NONE") {
      threatType =
        "UNAUTHORIZED_VERIFICATION";
    }

    reasons.push(
      "Verification attempt is not authorized for the requested identity or session.",
    );
  }

  /*
   * --------------------------------------------------
   * 3. Statistical verification
   * --------------------------------------------------
   */

  if (
    !input.verification.accepted
  ) {
    const statisticalRisk =
      clampRisk(
        input.verification.riskIndicator,
      );

    riskScore = Math.max(
      riskScore,
      statisticalRisk,
    );

    if (threatType === "NONE") {
      threatType =
        input.attackType ??
        "STATISTICAL_ANOMALY";
    }

    reasons.push(
      "Observed measurement distribution exceeded the configured verification threshold.",
    );
  }

  /*
   * --------------------------------------------------
   * 4. CHSH channel evidence
   * --------------------------------------------------
   */

  if (
    input.chsh &&
    !input.chsh.passesQuantumThreshold
  ) {
    /*
     * Failure to violate the classical CHSH bound
     * is evidence that the expected quantum correlation
     * was not demonstrated.
     */
    riskScore = Math.max(
      riskScore,
      0.75,
    );

    if (threatType === "NONE") {
      threatType =
        "QUANTUM_CHANNEL_ANOMALY";
    }

    reasons.push(
      "Expected Bell-state correlation was not demonstrated by the CHSH test.",
    );
  }

  /*
   * --------------------------------------------------
   * 5. Explicit attack context
   * --------------------------------------------------
   */

  if (input.attackType) {
    if (
      input.attackType === "REPLAY" &&
      input.replayDetected
    ) {
      threatType = "REPLAY";
    } else if (
      threatType === "NONE"
    ) {
      threatType =
        input.attackType;
    }

    reasons.push(
      `Attack context: ${input.attackType}.`,
    );
  }

  /*
   * --------------------------------------------------
   * 6. Determine final decision
   * --------------------------------------------------
   */

  const detected =
    riskScore > 0;

  const threatLevel =
    getThreatLevel(
      riskScore,
    );

  let recommendedAction:
    | "ALLOW"
    | "MONITOR"
    | "REJECT"
    | "BLOCK";

  if (riskScore >= 0.75) {
    recommendedAction = "BLOCK";
  } else if (riskScore >= 0.5) {
    recommendedAction = "REJECT";
  } else if (riskScore > 0) {
    recommendedAction = "MONITOR";
  } else {
    recommendedAction = "ALLOW";
  }

  if (!detected) {
    reasons.push(
      "No deterministic security anomaly was detected.",
    );
  }

  return {
    detected,
    threatLevel,
    threatType,
    riskScore,
    reasons,
    recommendedAction,
  };
}