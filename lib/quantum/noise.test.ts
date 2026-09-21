import { describe, expect, it } from "vitest";

import {
  applyNoise,
  NoiseModel,
} from "./noise";

import { createBasisState, fidelity } from "./state";

describe("Quantum noise models", () => {
  const zeroState = createBasisState(
    ["0", "1"],
    0,
  );

  const oneState = createBasisState(
    ["0", "1"],
    1,
  );

  it("NONE leaves the state unchanged", () => {
    const result = applyNoise(
      zeroState,
      "NONE",
      1,
    );

    expect(result.appliedOperator).toBe("I");
    expect(result.probability).toBe(1);
    expect(
      fidelity(result.state, zeroState),
    ).toBeCloseTo(1, 10);
  });

  it("BIT_FLIP applies X", () => {
    const result = applyNoise(
      zeroState,
      "BIT_FLIP",
      1,
    );

    expect(result.appliedOperator).toBe("X");
    expect(
      fidelity(result.state, oneState),
    ).toBeCloseTo(1, 10);
  });

  it("PHASE_FLIP applies Z", () => {
    const result = applyNoise(
      zeroState,
      "PHASE_FLIP",
      1,
    );

    expect(result.appliedOperator).toBe("Z");

    /*
     * Z|0> = |0>, so the physical state remains
     * identical up to global phase.
     */
    expect(
      fidelity(result.state, zeroState),
    ).toBeCloseTo(1, 10);
  });

  it("BIT_PHASE_FLIP applies Y", () => {
    const result = applyNoise(
      zeroState,
      "BIT_PHASE_FLIP",
      1,
    );

    expect(result.appliedOperator).toBe("Y");

    /*
     * Y|0> = i|1>, so fidelity with |1> is 1.
     */
    expect(
      fidelity(result.state, oneState),
    ).toBeCloseTo(1, 10);
  });

  it("DEPOLARIZING selects a non-identity disturbance", () => {
    const result = applyNoise(
      zeroState,
      "DEPOLARIZING",
      1,
    );

    expect(result.appliedOperator).toBe("Y");

    expect(
      fidelity(result.state, oneState),
    ).toBeCloseTo(1, 10);
  });

  it("probability 0 leaves the state unchanged", () => {
    const models: NoiseModel[] = [
      "NONE",
      "BIT_FLIP",
      "PHASE_FLIP",
      "BIT_PHASE_FLIP",
      "DEPOLARIZING",
    ];

    for (const model of models) {
      const result = applyNoise(
        zeroState,
        model,
        0,
      );

      expect(
        fidelity(result.state, zeroState),
      ).toBeCloseTo(1, 10);
    }
  });

  it("accepts probability 1", () => {
    const result = applyNoise(
      zeroState,
      "BIT_FLIP",
      1,
    );

    expect(result.probability).toBe(1);
  });

  it("rejects probability below 0", () => {
    expect(() =>
      applyNoise(
        zeroState,
        "BIT_FLIP",
        -0.1,
      ),
    ).toThrow();
  });

  it("rejects probability above 1", () => {
    expect(() =>
      applyNoise(
        zeroState,
        "BIT_FLIP",
        1.1,
      ),
    ).toThrow();
  });

  it("rejects non-finite probability", () => {
    expect(() =>
      applyNoise(
        zeroState,
        "BIT_FLIP",
        Infinity,
      ),
    ).toThrow();
  });
});