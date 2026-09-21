import { describe, expect, it } from "vitest";
import { simulateCHSH, CLASSICAL_CHSH_BOUND, QUANTUM_CHSH_BOUND } from "./chsh";
import { createBasisState } from "./state";

describe("CHSH Bell Inequality Simulation Engine", () => {
  it("simulates Bell state measurement and violates classical bound (S > 2.0)", () => {
    const result = simulateCHSH({
      shotsPerSetting: 2000,
      seed: 12345,
    });

    expect(result.violatesClassicalBound).toBe(true);
    expect(result.passesQuantumThreshold).toBe(true);
    expect(result.S).toBeGreaterThan(CLASSICAL_CHSH_BOUND);
    expect(result.S).toBeCloseTo(QUANTUM_CHSH_BOUND, 0.5); // close to ~2.828
    expect(result.totalShots).toBe(8000);
  });

  it("separable classical control state satisfies classical bound (S <= 2.0)", () => {
    // Product state |00> = |0> x |0>
    const separableState = createBasisState(["00", "01", "10", "11"], 0);

    const result = simulateCHSH({
      state: separableState,
      shotsPerSetting: 2000,
      seed: 12345,
    });

    expect(result.violatesClassicalBound).toBe(false);
    expect(result.S).toBeLessThanOrEqual(CLASSICAL_CHSH_BOUND + 0.1);
  });

  it("channel noise causes measurable degradation in CHSH Bell score", () => {
    const cleanResult = simulateCHSH({
      noiseModel: "NONE",
      noiseProbability: 0,
      seed: 12345,
    });

    const noisyResult = simulateCHSH({
      noiseModel: "DEPOLARIZING",
      noiseProbability: 0.5,
      seed: 12345,
    });

    expect(cleanResult.S).toBeGreaterThan(noisyResult.S);
    expect(noisyResult.violatesClassicalBound).toBe(false);
  });
});
