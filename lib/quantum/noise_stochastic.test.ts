import { describe, expect, it } from "vitest";
import { applyNoise } from "./noise";
import { createBasisState, fidelity } from "./state";
import { createRNG } from "./rng";

describe("Stochastic Quantum Noise", () => {
  const zeroState = createBasisState(["0", "1"], 0);

  it("p=0 leaves the state unchanged", () => {
    const rng = createRNG(42);
    const result = applyNoise(zeroState, "BIT_FLIP", 0, rng);

    expect(result.appliedOperator).toBe("I");
    expect(fidelity(result.state, zeroState)).toBeCloseTo(1, 10);
  });

  it("seeded runs are reproducible", () => {
    const rng1 = createRNG(12345);
    const result1 = applyNoise(zeroState, "DEPOLARIZING", 0.7, rng1);

    const rng2 = createRNG(12345);
    const result2 = applyNoise(zeroState, "DEPOLARIZING", 0.7, rng2);

    expect(result1.appliedOperator).toBe(result2.appliedOperator);
    expect(fidelity(result1.state, result2.state)).toBeCloseTo(1, 10);
  });

  it("different seeds produce different sampled outcomes", () => {
    let diffCount = 0;
    for (let s = 1; s <= 20; s++) {
      const rngA = createRNG(s * 100);
      const resA = applyNoise(zeroState, "DEPOLARIZING", 0.5, rngA);

      const rngB = createRNG(s * 100 + 1);
      const resB = applyNoise(zeroState, "DEPOLARIZING", 0.5, rngB);

      if (resA.appliedOperator !== resB.appliedOperator) {
        diffCount++;
      }
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it("repeated shots approximately follow the requested probability", () => {
    const shots = 1000;
    const probability = 0.3;
    let noiseCount = 0;

    const rng = createRNG(999);
    for (let i = 0; i < shots; i++) {
      const result = applyNoise(zeroState, "BIT_FLIP", probability, rng);
      if (result.appliedOperator !== "I") {
        noiseCount++;
      }
    }

    const observedRatio = noiseCount / shots;
    // For 1000 shots with p=0.3, ratio should be close to 0.3 (within +/- 0.08)
    expect(observedRatio).toBeGreaterThan(0.20);
    expect(observedRatio).toBeLessThan(0.40);
  });

  it("noise does not always trigger merely because p > 0", () => {
    const rng = createRNG(555);
    let noNoiseCount = 0;
    const shots = 50;

    for (let i = 0; i < shots; i++) {
      const result = applyNoise(zeroState, "PHASE_FLIP", 0.2, rng);
      if (result.appliedOperator === "I") {
        noNoiseCount++;
      }
    }

    // With p=0.2, ~80% of shots should have no noise
    expect(noNoiseCount).toBeGreaterThan(0);
  });
});
