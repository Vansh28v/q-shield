import {
  describe,
  expect,
  it,
} from "vitest";

import {
  average,
  averageLatency,
  calculateSecurityMetrics,
  calculateThroughput,
  fromPercentage,
  toPercentage,
} from "./metrics";

describe("security metrics", () => {
  it("calculates binary classification metrics", () => {
    const result =
      calculateSecurityMetrics({
        truePositive: 90,
        trueNegative: 95,
        falsePositive: 5,
        falseNegative: 10,
      });

    expect(result.totalSamples).toBe(
      200,
    );

    expect(
      result.falseAcceptanceRate,
    ).toBeCloseTo(
      5 / 100,
    );

    expect(
      result.falseRejectionRate,
    ).toBeCloseTo(
      10 / 100,
    );

    expect(
      result.detectionRate,
    ).toBeCloseTo(
      90 / 100,
    );

    expect(
      result.precision,
    ).toBeCloseTo(
      90 / 95,
    );

    expect(
      result.recall,
    ).toBeCloseTo(
      90 / 100,
    );

    expect(
      result.f1Score,
    ).toBeCloseTo(
      2 *
        (90 / 95) *
        (90 / 100) /
        ((90 / 95) +
          (90 / 100)),
    );

    expect(
      result.accuracy,
    ).toBeCloseTo(
      185 / 200,
    );
  });

  it("handles a perfect detector", () => {
    const result =
      calculateSecurityMetrics({
        truePositive: 100,
        trueNegative: 100,
        falsePositive: 0,
        falseNegative: 0,
      });

    expect(
      result.falseAcceptanceRate,
    ).toBe(0);

    expect(
      result.falseRejectionRate,
    ).toBe(0);

    expect(
      result.detectionRate,
    ).toBe(1);

    expect(
      result.precision,
    ).toBe(1);

    expect(
      result.recall,
    ).toBe(1);

    expect(
      result.f1Score,
    ).toBe(1);

    expect(
      result.accuracy,
    ).toBe(1);
  });

  it("handles an empty dataset", () => {
    const result =
      calculateSecurityMetrics({
        truePositive: 0,
        trueNegative: 0,
        falsePositive: 0,
        falseNegative: 0,
      });

    expect(
      result.totalSamples,
    ).toBe(0);

    expect(
      result.falseAcceptanceRate,
    ).toBe(0);

    expect(
      result.falseRejectionRate,
    ).toBe(0);

    expect(
      result.detectionRate,
    ).toBe(0);

    expect(
      result.precision,
    ).toBe(0);

    expect(
      result.recall,
    ).toBe(0);

    expect(
      result.f1Score,
    ).toBe(0);

    expect(
      result.accuracy,
    ).toBe(0);
  });

  it("converts ratios to percentages", () => {
    expect(
      toPercentage(0.018),
    ).toBeCloseTo(1.8);

    expect(
      toPercentage(0.82),
    ).toBeCloseTo(82);
  });

  it("converts percentages to ratios", () => {
    expect(
      fromPercentage(1.8),
    ).toBeCloseTo(0.018);

    expect(
      fromPercentage(82),
    ).toBeCloseTo(0.82);
  });

  it("calculates averages", () => {
    expect(
      average([
        100,
        200,
        300,
      ]),
    ).toBe(200);
  });

  it("returns zero for an empty average", () => {
    expect(
      average([]),
    ).toBe(0);
  });

  it("calculates average verification latency", () => {
    expect(
      averageLatency([
        100,
        150,
        200,
      ]),
    ).toBe(150);
  });

  it("calculates throughput", () => {
    expect(
      calculateThroughput(
        100,
        1000,
      ),
    ).toBe(100);
  });

  it("rejects invalid classification counts", () => {
    expect(() =>
      calculateSecurityMetrics({
        truePositive: -1,
        trueNegative: 0,
        falsePositive: 0,
        falseNegative: 0,
      }),
    ).toThrow();
  });

  it("rejects non-integer classification counts", () => {
    expect(() =>
      calculateSecurityMetrics({
        truePositive: 1.5,
        trueNegative: 0,
        falsePositive: 0,
        falseNegative: 0,
      }),
    ).toThrow();
  });

  it("rejects invalid percentage input", () => {
    expect(() =>
      toPercentage(
        Number.NaN,
      ),
    ).toThrow();

    expect(() =>
      fromPercentage(
        Number.POSITIVE_INFINITY,
      ),
    ).toThrow();
  });

  it("rejects invalid average values", () => {
    expect(() =>
      average([
        10,
        Number.NaN,
      ]),
    ).toThrow();
  });

  it("rejects invalid throughput input", () => {
    expect(() =>
      calculateThroughput(
        -1,
        1000,
      ),
    ).toThrow();

    expect(() =>
      calculateThroughput(
        10,
        0,
      ),
    ).toThrow();
  });
});