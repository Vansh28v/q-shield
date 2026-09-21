import { describe, expect, it } from "vitest";

import {
  applyPauli,
  getPauliEigenstate,
} from "./pauli";

import { fidelity, norm } from "./state";

describe("Pauli eigenstates", () => {
  it("creates |0> as the +1 eigenstate of Z", () => {
    const state = getPauliEigenstate("Z", 1);

    expect(state.amplitudes[0].re).toBeCloseTo(1);
    expect(state.amplitudes[1].re).toBeCloseTo(0);
    expect(norm(state)).toBeCloseTo(1);
  });

  it("creates |1> as the -1 eigenstate of Z", () => {
    const state = getPauliEigenstate("Z", -1);

    expect(state.amplitudes[0].re).toBeCloseTo(0);
    expect(state.amplitudes[1].re).toBeCloseTo(1);
    expect(norm(state)).toBeCloseTo(1);
  });

  it("creates |+> as the +1 eigenstate of X", () => {
    const state = getPauliEigenstate("X", 1);

    expect(state.amplitudes[0].re).toBeCloseTo(1 / Math.sqrt(2));
    expect(state.amplitudes[1].re).toBeCloseTo(1 / Math.sqrt(2));
    expect(norm(state)).toBeCloseTo(1);
  });

  it("creates |-> as the -1 eigenstate of X", () => {
    const state = getPauliEigenstate("X", -1);

    expect(state.amplitudes[0].re).toBeCloseTo(1 / Math.sqrt(2));
    expect(state.amplitudes[1].re).toBeCloseTo(-1 / Math.sqrt(2));
    expect(norm(state)).toBeCloseTo(1);
  });

  it("creates |+i> as the +1 eigenstate of Y", () => {
    const state = getPauliEigenstate("Y", 1);

    expect(state.amplitudes[0].re).toBeCloseTo(1 / Math.sqrt(2));
    expect(state.amplitudes[1].im).toBeCloseTo(1 / Math.sqrt(2));
    expect(norm(state)).toBeCloseTo(1);
  });

  it("creates |-i> as the -1 eigenstate of Y", () => {
    const state = getPauliEigenstate("Y", -1);

    expect(state.amplitudes[0].re).toBeCloseTo(1 / Math.sqrt(2));
    expect(state.amplitudes[1].im).toBeCloseTo(-1 / Math.sqrt(2));
    expect(norm(state)).toBeCloseTo(1);
  });

  it("Z|0> = +|0>", () => {
    const state = getPauliEigenstate("Z", 1);
    const result = applyPauli(state, "Z");

    expect(fidelity(result, state)).toBeCloseTo(1);
  });

  it("Z|1> = -|1>", () => {
    const state = getPauliEigenstate("Z", -1);
    const result = applyPauli(state, "Z");

    expect(fidelity(result, state)).toBeCloseTo(1);
  });

  it("X|+> = +|+>", () => {
    const state = getPauliEigenstate("X", 1);
    const result = applyPauli(state, "X");

    expect(fidelity(result, state)).toBeCloseTo(1);
  });

  it("X|-> = -|->", () => {
    const state = getPauliEigenstate("X", -1);
    const result = applyPauli(state, "X");

    expect(fidelity(result, state)).toBeCloseTo(1);
  });

  it("Y|+i> = +|+i>", () => {
    const state = getPauliEigenstate("Y", 1);
    const result = applyPauli(state, "Y");

    expect(fidelity(result, state)).toBeCloseTo(1);
  });

  it("Y|-i> = -|-i>", () => {
    const state = getPauliEigenstate("Y", -1);
    const result = applyPauli(state, "Y");

    expect(fidelity(result, state)).toBeCloseTo(1);
  });

  it("rejects Identity as an eigenstate selector", () => {
    expect(() => getPauliEigenstate("I", 1)).toThrow();
  });
});