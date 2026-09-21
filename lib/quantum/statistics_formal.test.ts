import { describe, expect, it } from "vitest";
import {
  calculateHoeffdingMargin,
  calculateObservedErrorRate,
  calculateThreshold,
  calculateWilsonScoreInterval,
} from "./statistics";

describe("Formal Statistical Verification Upgrades", () => {
  it("Hoeffding margin decreases as N increases", () => {
    const marginSmallN = calculateHoeffdingMargin(100, 0.01);
    const marginLargeN = calculateHoeffdingMargin(10000, 0.01);

    expect(marginSmallN).toBeGreaterThan(marginLargeN);
    expect(marginSmallN).toBeCloseTo(0.1517, 3);
    expect(marginLargeN).toBeCloseTo(0.01517, 3);
  });

  it("Wilson interval contains the observed error rate", () => {
    const errors = 20;
    const N = 200;
    const rate = calculateObservedErrorRate(errors, N);
    const interval = calculateWilsonScoreInterval(errors, N, 0.95);

    expect(rate).toBe(0.10);
    expect(interval.lower).toBeLessThan(rate);
    expect(interval.upper).toBeGreaterThan(rate);
    expect(interval.lower).toBeGreaterThan(0);
    expect(interval.upper).toBeLessThan(1);
  });

  it("handles zero-error case", () => {
    const rate = calculateObservedErrorRate(0, 100);
    const interval = calculateWilsonScoreInterval(0, 100, 0.95);
    const threshold = calculateThreshold(0, 100, 0.01);

    expect(rate).toBe(0);
    expect(interval.lower).toBe(0);
    expect(interval.upper).toBeGreaterThan(0);
    expect(threshold).toBeGreaterThan(0);
  });

  it("handles nonzero-error case", () => {
    const rate = calculateObservedErrorRate(15, 100);
    const margin = calculateHoeffdingMargin(100, 0.01);
    const threshold = calculateThreshold(0.05, 100, 0.01);

    expect(rate).toBe(0.15);
    expect(margin).toBeGreaterThan(0);
    expect(threshold).toBeCloseTo(0.05 + margin, 10);
  });
});
