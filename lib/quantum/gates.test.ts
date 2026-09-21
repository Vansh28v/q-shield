import { describe, expect, it } from "vitest";

import {
  H,
  X,
  Y,
  Z,
  applyCNOT,
  applySingleQubitGate,
} from "./gates";

import { createBasisState, norm } from "./state";

describe("Quantum gates", () => {
  it("X transforms |0> into |1>", () => {
    const zero = createBasisState(["0", "1"], 0);
    const result = applySingleQubitGate(zero, X, 0);

    expect(result.amplitudes[0].re).toBeCloseTo(0);
    expect(result.amplitudes[1].re).toBeCloseTo(1);
    expect(norm(result)).toBeCloseTo(1);
  });

  it("X transforms |1> into |0>", () => {
    const one = createBasisState(["0", "1"], 1);
    const result = applySingleQubitGate(one, X, 0);

    expect(result.amplitudes[0].re).toBeCloseTo(1);
    expect(result.amplitudes[1].re).toBeCloseTo(0);
  });

  it("Z leaves |0> unchanged", () => {
    const zero = createBasisState(["0", "1"], 0);
    const result = applySingleQubitGate(zero, Z, 0);

    expect(result.amplitudes[0].re).toBeCloseTo(1);
    expect(result.amplitudes[1].re).toBeCloseTo(0);
  });

  it("Z changes the phase of |1>", () => {
    const one = createBasisState(["0", "1"], 1);
    const result = applySingleQubitGate(one, Z, 0);

    expect(result.amplitudes[0].re).toBeCloseTo(0);
    expect(result.amplitudes[1].re).toBeCloseTo(-1);
  });

  it("H transforms |0> into |+>", () => {
    const zero = createBasisState(["0", "1"], 0);
    const result = applySingleQubitGate(zero, H, 0);

    expect(result.amplitudes[0].re).toBeCloseTo(1 / Math.sqrt(2));
    expect(result.amplitudes[1].re).toBeCloseTo(1 / Math.sqrt(2));
    expect(norm(result)).toBeCloseTo(1);
  });

  it("H transforms |1> into |->", () => {
    const one = createBasisState(["0", "1"], 1);
    const result = applySingleQubitGate(one, H, 0);

    expect(result.amplitudes[0].re).toBeCloseTo(1 / Math.sqrt(2));
    expect(result.amplitudes[1].re).toBeCloseTo(-1 / Math.sqrt(2));
  });

  it("Y transforms |0> into i|1>", () => {
    const zero = createBasisState(["0", "1"], 0);
    const result = applySingleQubitGate(zero, Y, 0);

    expect(result.amplitudes[0].re).toBeCloseTo(0);
    expect(result.amplitudes[1].re).toBeCloseTo(0);
    expect(result.amplitudes[1].im).toBeCloseTo(1);
  });

  it("CNOT flips target when control is |1>", () => {
    const state = createBasisState(
      ["00", "01", "10", "11"],
      2
    );

    const result = applyCNOT(state, 0, 1);

    expect(result.amplitudes[3].re).toBeCloseTo(1);
    expect(norm(result)).toBeCloseTo(1);
  });

  it("CNOT does not flip target when control is |0>", () => {
    const state = createBasisState(
      ["00", "01", "10", "11"],
      1
    );

    const result = applyCNOT(state, 0, 1);

    expect(result.amplitudes[1].re).toBeCloseTo(1);
    expect(norm(result)).toBeCloseTo(1);
  });
});