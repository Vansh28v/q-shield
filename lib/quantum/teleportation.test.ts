import { describe, expect, it } from "vitest";

import {
  teleport,
  TeleportationBits,
} from "./teleportation";

import { createBasisState } from "./state";
import { normalize, QuantumState } from "./state";

function createState(
  amplitudes: QuantumState["amplitudes"],
): QuantumState {
  return normalize({
    basisStates: ["0", "1"],
    amplitudes,
  });
}

const zeroState = createBasisState(["0", "1"], 0);

const oneState = createBasisState(["0", "1"], 1);

const plusState = createState([
  { re: 1, im: 0 },
  { re: 1, im: 0 },
]);

const minusState = createState([
  { re: 1, im: 0 },
  { re: -1, im: 0 },
]);

const plusIState = createState([
  { re: 1, im: 0 },
  { re: 0, im: 1 },
]);

const minusIState = createState([
  { re: 1, im: 0 },
  { re: 0, im: -1 },
]);

const allBranches: TeleportationBits[] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

describe("Quantum teleportation", () => {
  it("teleports |0> through all four measurement branches", () => {
    for (const bits of allBranches) {
      const result = teleport(zeroState, bits);

      expect(result.fidelity).toBeCloseTo(1, 10);
    }
  });

  it("teleports |1> through all four measurement branches", () => {
    for (const bits of allBranches) {
      const result = teleport(oneState, bits);

      expect(result.fidelity).toBeCloseTo(1, 10);
    }
  });

  it("teleports |+> through all four measurement branches", () => {
    for (const bits of allBranches) {
      const result = teleport(plusState, bits);

      expect(result.fidelity).toBeCloseTo(1, 10);
    }
  });

  it("teleports |-> through all four measurement branches", () => {
    for (const bits of allBranches) {
      const result = teleport(minusState, bits);

      expect(result.fidelity).toBeCloseTo(1, 10);
    }
  });

  it("teleports |+i> through all four measurement branches", () => {
    for (const bits of allBranches) {
      const result = teleport(plusIState, bits);

      expect(result.fidelity).toBeCloseTo(1, 10);
    }
  });

  it("teleports |-i> through all four measurement branches", () => {
    for (const bits of allBranches) {
      const result = teleport(minusIState, bits);

      expect(result.fidelity).toBeCloseTo(1, 10);
    }
  });

  it("uses identity correction for 00", () => {
    const result = teleport(plusState, [0, 0]);

    expect(result.correction).toEqual(["I"]);
  });

  it("uses X correction for 01", () => {
    const result = teleport(plusState, [0, 1]);

    expect(result.correction).toEqual(["X"]);
  });

  it("uses Z correction for 10", () => {
    const result = teleport(plusState, [1, 0]);

    expect(result.correction).toEqual(["Z"]);
  });

  it("uses ZX correction for 11", () => {
    const result = teleport(plusState, [1, 1]);

    expect(result.correction).toEqual(["Z", "X"]);
  });

  it("rejects non-single-qubit input states", () => {
    expect(() =>
      teleport(
        createBasisState(["00", "01", "10", "11"], 0),
        [0, 0],
      ),
    ).toThrow();
  });
});