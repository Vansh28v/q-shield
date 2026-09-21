export type ClassificationCounts = {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
};

export type SecurityMetrics = {
  totalSamples: number;

  falseAcceptanceRate: number;
  falseRejectionRate: number;

  detectionRate: number;
  precision: number;
  recall: number;
  f1Score: number;

  accuracy: number;
};

function safeDivide(
  numerator: number,
  denominator: number,
): number {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

function validateCount(
  value: number,
  name: string,
): void {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${name} must be a non-negative integer`,
    );
  }
}

/**
 * Calculate security metrics from binary
 * threat-detection classification results.
 *
 * Positive = malicious/threat
 * Negative = legitimate/normal
 */
export function calculateSecurityMetrics(
  counts: ClassificationCounts,
): SecurityMetrics {
  validateCount(
    counts.truePositive,
    "truePositive",
  );

  validateCount(
    counts.trueNegative,
    "trueNegative",
  );

  validateCount(
    counts.falsePositive,
    "falsePositive",
  );

  validateCount(
    counts.falseNegative,
    "falseNegative",
  );

  const {
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
  } = counts;

  const totalSamples =
    truePositive +
    trueNegative +
    falsePositive +
    falseNegative;

  /*
   * FAR:
   *
   * Of all legitimate verification attempts,
   * how many were incorrectly accepted?
   */
  const falseAcceptanceRate =
    safeDivide(
      falsePositive,
      falsePositive +
        trueNegative,
    );

  /*
   * FRR:
   *
   * Of all legitimate signatures presented
   * for verification, how many were rejected?
   *
   * In this binary evaluation model this is
   * represented by false negatives relative
   * to legitimate verification outcomes.
   */
  const falseRejectionRate =
    safeDivide(
      falseNegative,
      truePositive +
        falseNegative,
    );

  /*
   * Detection rate / recall:
   *
   * How many actual threats were detected?
   */
  const detectionRate =
    safeDivide(
      truePositive,
      truePositive +
        falseNegative,
    );

  /*
   * Precision:
   *
   * How many detected threats were actually
   * threats?
   */
  const precision =
    safeDivide(
      truePositive,
      truePositive +
        falsePositive,
    );

  const recall =
    detectionRate;

  const f1Score =
    safeDivide(
      2 *
        precision *
        recall,
      precision + recall,
    );

  const accuracy =
    safeDivide(
      truePositive +
        trueNegative,
      totalSamples,
    );

  return {
    totalSamples,

    falseAcceptanceRate,
    falseRejectionRate,

    detectionRate,
    precision,
    recall,
    f1Score,

    accuracy,
  };
}

/**
 * Convert a ratio into a percentage.
 *
 * Example:
 * 0.018 -> 1.8
 */
export function toPercentage(
  ratio: number,
): number {
  if (
    !Number.isFinite(ratio)
  ) {
    throw new Error(
      "ratio must be a finite number",
    );
  }

  return ratio * 100;
}

/**
 * Convert a percentage into a ratio.
 *
 * Example:
 * 1.8 -> 0.018
 */
export function fromPercentage(
  percentage: number,
): number {
  if (
    !Number.isFinite(percentage)
  ) {
    throw new Error(
      "percentage must be a finite number",
    );
  }

  return percentage / 100;
}

/**
 * Calculate the average of numeric measurements.
 */
export function average(
  values: number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new Error(
        "All values must be finite numbers",
      );
    }
  }

  const total =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return total / values.length;
}

/**
 * Calculate average verification latency.
 *
 * Result is expressed in milliseconds.
 */
export function averageLatency(
  latenciesMs: number[],
): number {
  return average(latenciesMs);
}

/**
 * Calculate throughput in experiments per second.
 */
export function calculateThroughput(
  completedExperiments: number,
  elapsedMilliseconds: number,
): number {
  if (
    !Number.isInteger(
      completedExperiments,
    ) ||
    completedExperiments < 0
  ) {
    throw new Error(
      "completedExperiments must be a non-negative integer",
    );
  }

  if (
    !Number.isFinite(
      elapsedMilliseconds,
    ) ||
    elapsedMilliseconds <= 0
  ) {
    throw new Error(
      "elapsedMilliseconds must be greater than zero",
    );
  }

  return (
    completedExperiments /
    (elapsedMilliseconds / 1000)
  );
}