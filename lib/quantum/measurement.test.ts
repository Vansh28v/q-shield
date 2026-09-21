import { describe, expect, it } from "vitest";

import {
  getTheoreticalProbabilities,
  measureState,
} from "./measurement";

import { createRNG } from "./rng";
import { createBasisState } from "./state";

describe("Quantum measurement", () => {
  it("|0> has theoretical probability 1 for outcome 0", () => {
    const state = createBasisState(
      ["0", "1"],
      0
    );

    const results =
      getTheoreticalProbabilities(state);

    expect(results[0].probability).toBeCloseTo(1);
    expect(results[1].probability).toBeCloseTo(0);
  });

  it("|1> has theoretical probability 1 for outcome 1", () => {
    const state = createBasisState(
      ["0", "1"],
      1
    );

    const results =
      getTheoreticalProbabilities(state);

    expect(results[0].probability).toBeCloseTo(0);
    expect(results[1].probability).toBeCloseTo(1);
  });

  it("|0> always measures as 0", () => {
    const state = createBasisState(
      ["0", "1"],
      0
    );

    const result = measureState(
      state,
      1000,
      createRNG(12345)
    );

    expect(result.results[0].count).toBe(1000);
    expect(result.results[1].count).toBe(0);
  });

  it("|1> always measures as 1", () => {
    const state = createBasisState(
      ["0", "1"],
      1
    );

    const result = measureState(
      state,
      1000,
      createRNG(12345)
    );

    expect(result.results[0].count).toBe(0);
    expect(result.results[1].count).toBe(1000);
  });

  it("|+> has approximately 50/50 measurement distribution", () => {
    const value = 1 / Math.sqrt(2);

    const plus = {
      amplitudes: [
        { re: value, im: 0 },
        { re: value, im: 0 },
      ],
      basisStates: ["0", "1"],
    };

    const result = measureState(
      plus,
      10000,
      createRNG(12345)
    );

    const probability0 =
      result.results[0].probability;

    const probability1 =
      result.results[1].probability;

    expect(probability0).toBeGreaterThan(0.47);
    expect(probability0).toBeLessThan(0.53);

    expect(probability1).toBeGreaterThan(0.47);
    expect(probability1).toBeLessThan(0.53);
  });

  it("same seed produces identical results", () => {
    const value = 1 / Math.sqrt(2);

    const plus = {
      amplitudes: [
        { re: value, im: 0 },
        { re: value, im: 0 },
      ],
      basisStates: ["0", "1"],
    };

    const result1 = measureState(
      plus,
      1000,
      createRNG(42)
    );

    const result2 = measureState(
      plus,
      1000,
      createRNG(42)
    );

    expect(result1).toEqual(result2);
  });

  it("different seeds can produce different results", () => {
    const value = 1 / Math.sqrt(2);

    const plus = {
      amplitudes: [
        { re: value, im: 0 },
        { re: value, im: 0 },
      ],
      basisStates: ["0", "1"],
    };

    const result1 = measureState(
      plus,
      1000,
      createRNG(42)
    );

    const result2 = measureState(
      plus,
      1000,
      createRNG(999)
    );

    expect(result1).not.toEqual(result2);
  });

  it("rejects invalid shot counts", () => {
    const state = createBasisState(
      ["0", "1"],
      0
    );

    const rng = createRNG(42);

    expect(() =>
      measureState(state, 0, rng)
    ).toThrow();

    expect(() =>
      measureState(state, -1, rng)
    ).toThrow();

    expect(() =>
      measureState(state, 1.5, rng)
    ).toThrow();
  });

  it("rejects mismatched amplitudes and basis states", () => {
    const invalidState = {
      amplitudes: [{ re: 1, im: 0 }],
      basisStates: ["0", "1"],
    };

    expect(() =>
      measureState(
        invalidState,
        100,
        createRNG(42)
      )
    ).toThrow();
  });
});