import {
  MeasurementResult,
  MeasurementStatistics,
} from "./measurement";

import {
  calculateStatistics,
  calculateHoeffdingMargin,
  calculateWilsonScoreInterval,
  StatisticalMetrics,
  WilsonInterval,
} from "./statistics";

export type VerificationDecision =
  | "ACCEPT"
  | "REJECT";

export type VerificationResult = {
  decision: VerificationDecision;
  accepted: boolean;
  threshold: number;
  deviation: number;
  riskIndicator: number;
  confidence: number;
  statisticalMargin?: number;
  observedErrorRate?: number;
  observedErrors?: number;
  totalSamples?: number;
  confidenceInterval?: WilsonInterval;
  reason?: string;
  metrics: StatisticalMetrics;
};

const NUMERICAL_TOLERANCE = 1e-12;

/**
 * Verify a measured quantum distribution against its expected distribution
 * using deterministic statistical verification (Hoeffding margin & TVD).
 */
export function verifyMeasurement(
  observed: MeasurementStatistics,
  expected: MeasurementResult[],
  threshold: number,
  epsilon = 0.01,
): VerificationResult {
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error(
      "Verification threshold must be a non-negative finite number.",
    );
  }

  const metrics = calculateStatistics(
    observed,
    expected,
  );

  const deviation = metrics.totalVariationDistance;
  const totalSamples = observed.shots;
  const observedErrorRate = deviation;
  const observedErrors = Math.round(deviation * totalSamples);
  const statisticalMargin = calculateHoeffdingMargin(totalSamples, epsilon);
  const confidenceInterval = calculateWilsonScoreInterval(observedErrors, totalSamples);

  /*
   * Numerical tolerance prevents floating-point
   * rounding from incorrectly rejecting a value
   * that is mathematically equal to the threshold.
   */
  const accepted = deviation <= threshold + NUMERICAL_TOLERANCE;

  const riskIndicator =
    threshold === 0
      ? deviation > NUMERICAL_TOLERANCE
        ? 1
        : 0
      : Math.min(deviation / threshold, 1);

  const confidence =
    threshold === 0
      ? accepted
        ? 1
        : 0
      : Math.max(0, 1 - deviation / threshold);

  const reason = accepted
    ? `Measurement deviation (${deviation.toFixed(4)}) is within statistical threshold (${threshold.toFixed(4)}).`
    : `Measurement deviation (${deviation.toFixed(4)}) exceeded statistical threshold (${threshold.toFixed(4)}).`;

  return {
    decision: accepted ? "ACCEPT" : "REJECT",
    accepted,
    threshold,
    deviation,
    riskIndicator,
    confidence,
    statisticalMargin,
    observedErrorRate,
    observedErrors,
    totalSamples,
    confidenceInterval,
    reason,
    metrics,
  };
}