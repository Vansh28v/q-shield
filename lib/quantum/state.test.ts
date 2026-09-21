import { describe, expect, it } from "vitest";

import {
  createBasisState,
  fidelity,
  innerProduct,
  norm,
  normalize,
  tensorProduct,
} from "./state";

describe("Quantum state operations", () => {
  const zero = createBasisState(["0", "1"], 0);
  const one = createBasisState(["0", "1"], 1);

  it("calculates the norm of a normalized state", () => {
    expect(norm(zero)).toBeCloseTo(1);
  });

  it("normalizes an unnormalized state", () => {
    const state = {
      amplitudes: [
        { re: 2, im: 0 },
        { re: 0, im: 0 },
      ],
      basisStates: ["0", "1"],
    };

    const normalized = normalize(state);

    expect(norm(normalized)).toBeCloseTo(1);
    expect(normalized.amplitudes[0].re).toBeCloseTo(1);
  });

  it("calculates inner product", () => {
    const result = innerProduct(zero, zero);

    expect(result.re).toBeCloseTo(1);
    expect(result.im).toBeCloseTo(0);
  });

  it("gives zero inner product for orthogonal basis states", () => {
    const result = innerProduct(zero, one);

    expect(result.re).toBeCloseTo(0);
    expect(result.im).toBeCloseTo(0);
  });

  it("calculates fidelity of identical states", () => {
    expect(fidelity(zero, zero)).toBeCloseTo(1);
  });

  it("calculates fidelity of orthogonal states", () => {
    expect(fidelity(zero, one)).toBeCloseTo(0);
  });

  it("creates tensor products", () => {
    const state = tensorProduct(zero, one);

    expect(state.basisStates).toEqual([
      "00",
      "01",
      "10",
      "11",
    ]);

    expect(state.amplitudes).toEqual([
      { re: 0, im: 0 },
      { re: 1, im: 0 },
      { re: 0, im: 0 },
      { re: 0, im: 0 },
    ]);
  });

  it("creates a basis state correctly", () => {
    const state = createBasisState(["00", "01", "10", "11"], 2);

    expect(state.amplitudes[2]).toEqual({
      re: 1,
      im: 0,
    });

    expect(norm(state)).toBeCloseTo(1);
  });
});