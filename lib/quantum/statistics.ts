import {
  MeasurementResult,
  MeasurementStatistics,
} from "./measurement";

export type WilsonInterval = {
  lower: number;
  upper: number;
  confidenceLevel: number;
};

export type StatisticalMetrics = {
  totalVariationDistance: number;
  meanAbsoluteDeviation: number;
  chiSquare: number;
  maxDeviation: number;
  observedErrorRate?: number;
  hoeffdingMargin?: number;
  wilsonInterval?: WilsonInterval;
};

/**
 * Calculate observed error rate:
 * errorRate = errors / N
 */
export function calculateObservedErrorRate(
  errors: number,
  totalSamples: number,
): number {
  if (!Number.isFinite(errors) || errors < 0) {
    throw new Error("errors must be a non-negative number.");
  }
  if (!Number.isFinite(totalSamples) || totalSamples <= 0) {
    return 0;
  }
  return errors / totalSamples;
}

/**
 * Calculate Hoeffding-style statistical margin:
 * delta = sqrt( ln(1 / epsilon) / (2N) )
 */
export function calculateHoeffdingMargin(
  totalSamples: number,
  epsilon = 0.01,
): number {
  if (!Number.isFinite(totalSamples) || totalSamples <= 0) {
    return 0;
  }
  if (!Number.isFinite(epsilon) || epsilon <= 0 || epsilon >= 1) {
    throw new Error("Epsilon must be between 0 and 1 exclusive.");
  }
  return Math.sqrt(Math.log(1 / epsilon) / (2 * totalSamples));
}

/**
 * Calculate verification threshold based on legitimate noise allowance
 * plus the Hoeffding statistical margin:
 * threshold = p0 + delta
 */
export function calculateThreshold(
  legitimateNoiseRate: number,
  totalSamples: number,
  epsilon = 0.01,
): number {
  if (!Number.isFinite(legitimateNoiseRate) || legitimateNoiseRate < 0) {
    throw new Error("legitimateNoiseRate must be a non-negative number.");
  }
  const margin = calculateHoeffdingMargin(totalSamples, epsilon);
  return legitimateNoiseRate + margin;
}

/**
 * Calculate Wilson score confidence interval for binomial error rate.
 */
export function calculateWilsonScoreInterval(
  errors: number,
  totalSamples: number,
  confidenceLevel = 0.95,
): WilsonInterval {
  if (totalSamples <= 0) {
    return { lower: 0, upper: 0, confidenceLevel };
  }

  let z = 1.96; // 95%
  if (confidenceLevel >= 0.99) {
    z = 2.576;
  } else if (confidenceLevel <= 0.90) {
    z = 1.645;
  }

  const p = Math.max(0, Math.min(1, errors / totalSamples));
  const z2 = z * z;
  const n = totalSamples;

  const center = (p + z2 / (2 * n)) / (1 + z2 / n);
  const margin =
    (z / (1 + z2 / n)) *
    Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

  const lower = Math.max(0, center - margin);
  const upper = Math.min(1, center + margin);

  return { lower, upper, confidenceLevel };
}

/**
 * Convert measurement statistics into a probability distribution.
 */
function getProbabilities(
  statistics: MeasurementStatistics,
): number[] {
  return statistics.results.map(
    (result) => result.probability,
  );
}

/**
 * Total Variation Distance:
 *
 * TVD = 1/2 * Σ |P_observed - P_expected|
 */
export function totalVariationDistance(
  observed: MeasurementStatistics,
  expected: MeasurementResult[],
): number {
  const observedProbabilities = getProbabilities(observed);

  if (
    observedProbabilities.length !==
    expected.length
  ) {
    throw new Error(
      "Observed and expected distributions must have the same number of outcomes.",
    );
  }

  let sum = 0;

  for (let i = 0; i < expected.length; i++) {
    sum += Math.abs(
      observedProbabilities[i] -
        expected[i].probability,
    );
  }

  return sum / 2;
}

/**
 * Mean Absolute Deviation:
 *
 * MAD = (1/n) * Σ |P_observed - P_expected|
 */
export function meanAbsoluteDeviation(
  observed: MeasurementStatistics,
  expected: MeasurementResult[],
): number {
  const observedProbabilities = getProbabilities(observed);

  if (
    observedProbabilities.length !==
    expected.length
  ) {
    throw new Error(
      "Observed and expected distributions must have the same number of outcomes.",
    );
  }

  let sum = 0;

  for (let i = 0; i < expected.length; i++) {
    sum += Math.abs(
      observedProbabilities[i] -
        expected[i].probability,
    );
  }

  return sum / expected.length;
}

/**
 * Chi-square statistic:
 *
 * χ² = Σ (O - E)² / E
 *
 * Expected counts are derived from the expected
 * probabilities and observed shot count.
 */
export function chiSquare(
  observed: MeasurementStatistics,
  expected: MeasurementResult[],
): number {
  if (
    observed.results.length !==
    expected.length
  ) {
    throw new Error(
      "Observed and expected distributions must have the same number of outcomes.",
    );
  }

  let statistic = 0;

  for (let i = 0; i < expected.length; i++) {
    const expectedCount =
      expected[i].probability *
      observed.shots;

    const observedCount =
      observed.results[i].count;

    // Skip outcomes with zero expected count.
    if (expectedCount <= 0) {
      continue;
    }

    statistic +=
      ((observedCount - expectedCount) ** 2) /
      expectedCount;
  }

  return statistic;
}

/**
 * Maximum absolute deviation between the observed
 * and expected probability distributions.
 */
export function maximumDeviation(
  observed: MeasurementStatistics,
  expected: MeasurementResult[],
): number {
  const observedProbabilities = getProbabilities(observed);

  if (
    observedProbabilities.length !==
    expected.length
  ) {
    throw new Error(
      "Observed and expected distributions must have the same number of outcomes.",
    );
  }

  let maximum = 0;

  for (let i = 0; i < expected.length; i++) {
    const deviation = Math.abs(
      observedProbabilities[i] -
        expected[i].probability,
    );

    maximum = Math.max(
      maximum,
      deviation,
    );
  }

  return maximum;
}

/**
 * Calculate all statistical metrics at once.
 */
export function calculateStatistics(
  observed: MeasurementStatistics,
  expected: MeasurementResult[],
): StatisticalMetrics {
  const tvd = totalVariationDistance(observed, expected);
  const mad = meanAbsoluteDeviation(observed, expected);
  const cs = chiSquare(observed, expected);
  const md = maximumDeviation(observed, expected);
  const observedErrorRate = tvd;
  const hoeffdingMargin = calculateHoeffdingMargin(observed.shots);
  const wilsonInterval = calculateWilsonScoreInterval(
    Math.round(observedErrorRate * observed.shots),
    observed.shots,
  );

  return {
    totalVariationDistance: tvd,
    meanAbsoluteDeviation: mad,
    chiSquare: cs,
    maxDeviation: md,
    observedErrorRate,
    hoeffdingMargin,
    wilsonInterval,
  };
}