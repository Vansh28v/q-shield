import { describe, expect, it } from "vitest";

import {
  calculateCHSH,
  idealCHSH,
  CLASSICAL_CHSH_BOUND,
  QUANTUM_CHSH_BOUND,
} from "./chsh";

describe("CHSH Bell inequality", () => {
  it("calculates the CHSH parameter", () => {
    const result = calculateCHSH(
      0.7071,
      0.7071,
      0.7071,
      -0.7071,
    );

    expect(result.S).toBeCloseTo(
      2.8284,
      3,
    );

    expect(result.absoluteS).toBeCloseTo(
      2.8284,
      3,
    );
  });

  it("detects violation of the classical bound", () => {
    const result = idealCHSH();

    expect(result.absoluteS).toBeGreaterThan(
      CLASSICAL_CHSH_BOUND,
    );

    expect(
      result.passesQuantumThreshold,
    ).toBe(true);
  });

  it("matches the theoretical quantum maximum", () => {
    const result = idealCHSH();

    expect(result.S).toBeCloseTo(
      QUANTUM_CHSH_BOUND,
      10,
    );
  });

  it("does not classify the classical boundary as quantum violation", () => {
    const result = calculateCHSH(
      0.5,
      0.5,
      0.5,
      -0.5,
    );

    expect(result.absoluteS).toBeCloseTo(
      2,
      10,
    );

    expect(
      result.passesQuantumThreshold,
    ).toBe(false);
  });

  it("handles negative CHSH values using absolute value", () => {
    const result = calculateCHSH(
      -0.7071,
      -0.7071,
      -0.7071,
      0.7071,
    );

    expect(result.S).toBeCloseTo(
      -2.8284,
      3,
    );

    expect(result.absoluteS).toBeCloseTo(
      2.8284,
      3,
    );

    expect(
      result.passesQuantumThreshold,
    ).toBe(true);
  });

  it("rejects correlations outside the physical range", () => {
    expect(() =>
      calculateCHSH(
        1.1,
        0.5,
        0.5,
        -0.5,
      ),
    ).toThrow();

    expect(() =>
      calculateCHSH(
        -1.1,
        0.5,
        0.5,
        -0.5,
      ),
    ).toThrow();
  });

  it("rejects non-finite correlations", () => {
    expect(() =>
      calculateCHSH(
        Infinity,
        0.5,
        0.5,
        -0.5,
      ),
    ).toThrow();

    expect(() =>
      calculateCHSH(
        NaN,
        0.5,
        0.5,
        -0.5,
      ),
    ).toThrow();
  });
});