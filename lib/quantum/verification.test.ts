import { describe, expect, it } from "vitest";

import {
  verifyMeasurement,
} from "./verification";

import {
  getTheoreticalProbabilities,
  MeasurementStatistics,
} from "./measurement";

import { createBasisState } from "./state";

describe("Quantum verification", () => {
  const expected =
    getTheoreticalProbabilities(
      createBasisState(["0", "1"], 0),
    );

  const legitimateMeasurement:
    MeasurementStatistics = {
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

  const mildlyDeviatedMeasurement:
    MeasurementStatistics = {
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

  const stronglyDeviatedMeasurement:
    MeasurementStatistics = {
      shots: 1000,
      results: [
        {
          outcome: "0",
          count: 800,
          probability: 0.8,
        },
        {
          outcome: "1",
          count: 200,
          probability: 0.2,
        },
      ],
    };

  it("accepts an ideal legitimate measurement", () => {
    const result = verifyMeasurement(
      legitimateMeasurement,
      expected,
      0.02,
    );

    expect(result.accepted).toBe(true);
    expect(result.decision).toBe("ACCEPT");
    expect(result.deviation).toBeCloseTo(0, 10);
    expect(result.riskIndicator).toBe(0);
    expect(result.confidence).toBe(1);
  });

  it("accepts a measurement exactly at the threshold", () => {
    const result = verifyMeasurement(
      mildlyDeviatedMeasurement,
      expected,
      0.02,
    );

    expect(result.accepted).toBe(true);
    expect(result.decision).toBe("ACCEPT");
    expect(result.deviation).toBeCloseTo(0.02, 10);
    expect(result.riskIndicator).toBeCloseTo(1, 10);
    expect(result.confidence).toBeCloseTo(0, 10);
  });

  it("rejects a measurement above the threshold", () => {
    const result = verifyMeasurement(
      stronglyDeviatedMeasurement,
      expected,
      0.02,
    );

    expect(result.accepted).toBe(false);
    expect(result.decision).toBe("REJECT");
    expect(result.deviation).toBeCloseTo(0.2, 10);
    expect(result.riskIndicator).toBe(1);
    expect(result.confidence).toBe(0);
  });

  it("returns all statistical metrics", () => {
    const result = verifyMeasurement(
      mildlyDeviatedMeasurement,
      expected,
      0.02,
    );

    expect(
      result.metrics.totalVariationDistance,
    ).toBeCloseTo(0.02, 10);

    expect(
      result.metrics.meanAbsoluteDeviation,
    ).toBeCloseTo(0.02, 10);

    expect(
      result.metrics.maxDeviation,
    ).toBeCloseTo(0.02, 10);

    expect(
      result.metrics.chiSquare,
    ).toBeCloseTo(0.4, 10);
  });

  it("rejects a negative threshold", () => {
    expect(() =>
      verifyMeasurement(
        legitimateMeasurement,
        expected,
        -0.01,
      ),
    ).toThrow();
  });

  it("rejects a non-finite threshold", () => {
    expect(() =>
      verifyMeasurement(
        legitimateMeasurement,
        expected,
        Infinity,
      ),
    ).toThrow();
  });

  it("handles a zero threshold", () => {
    const result = verifyMeasurement(
      legitimateMeasurement,
      expected,
      0,
    );

    expect(result.accepted).toBe(true);
    expect(result.decision).toBe("ACCEPT");
    expect(result.riskIndicator).toBe(0);
    expect(result.confidence).toBe(1);
  });
});