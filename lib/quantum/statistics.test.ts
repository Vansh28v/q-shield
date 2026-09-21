import { describe, expect, it } from "vitest";

import {
  calculateStatistics,
  chiSquare,
  maximumDeviation,
  meanAbsoluteDeviation,
  totalVariationDistance,
} from "./statistics";

import {
  getTheoreticalProbabilities,
  MeasurementStatistics,
} from "./measurement";

import { createBasisState } from "./state";

describe("Quantum statistical analysis", () => {
  const expected = getTheoreticalProbabilities(
    createBasisState(["0", "1"], 0),
  );

  const perfectMeasurement: MeasurementStatistics = {
    shots: 1000,
    results: [
      {
        outcome: "0",
        count: 1000,
        probability: 1,
      },
      {
        outcome: "1",
        count: 0,
        probability: 0,
      },
    ],
  };

  const slightlyDeviatedMeasurement: MeasurementStatistics = {
    shots: 1000,
    results: [
      {
        outcome: "0",
        count: 980,
        probability: 0.98,
      },
      {
        outcome: "1",
        count: 20,
        probability: 0.02,
      },
    ],
  };

  it("returns zero TVD for identical distributions", () => {
    expect(
      totalVariationDistance(
        perfectMeasurement,
        expected,
      ),
    ).toBeCloseTo(0, 10);
  });

  it("calculates TVD correctly", () => {
    expect(
      totalVariationDistance(
        slightlyDeviatedMeasurement,
        expected,
      ),
    ).toBeCloseTo(0.02, 10);
  });

  it("calculates mean absolute deviation", () => {
    expect(
      meanAbsoluteDeviation(
        slightlyDeviatedMeasurement,
        expected,
      ),
    ).toBeCloseTo(0.02, 10);
  });

  it("calculates maximum deviation", () => {
    expect(
      maximumDeviation(
        slightlyDeviatedMeasurement,
        expected,
      ),
    ).toBeCloseTo(0.02, 10);
  });

  it("returns zero chi-square for identical distributions", () => {
    expect(
      chiSquare(
        perfectMeasurement,
        expected,
      ),
    ).toBeCloseTo(0, 10);
  });

  it("calculates chi-square deviation", () => {
    expect(
      chiSquare(
        slightlyDeviatedMeasurement,
        expected,
      ),
    ).toBeCloseTo(0.4, 10);
  });

  it("calculates all metrics together", () => {
    const metrics = calculateStatistics(
      slightlyDeviatedMeasurement,
      expected,
    );

    expect(
      metrics.totalVariationDistance,
    ).toBeCloseTo(0.02, 10);

    expect(
      metrics.meanAbsoluteDeviation,
    ).toBeCloseTo(0.02, 10);

    expect(
      metrics.maxDeviation,
    ).toBeCloseTo(0.02, 10);

    expect(
      metrics.chiSquare,
    ).toBeCloseTo(0.4, 10);
  });

  it("rejects distributions with different sizes", () => {
    const invalidExpected = [
      {
        outcome: "0",
        count: 0,
        probability: 1,
      },
    ];

    expect(() =>
      totalVariationDistance(
        slightlyDeviatedMeasurement,
        invalidExpected,
      ),
    ).toThrow();

    expect(() =>
      meanAbsoluteDeviation(
        slightlyDeviatedMeasurement,
        invalidExpected,
      ),
    ).toThrow();

    expect(() =>
      chiSquare(
        slightlyDeviatedMeasurement,
        invalidExpected,
      ),
    ).toThrow();

    expect(() =>
      maximumDeviation(
        slightlyDeviatedMeasurement,
        invalidExpected,
      ),
    ).toThrow();
  });
});