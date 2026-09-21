import { describe, expect, it } from "vitest";
import { createBellState } from "./bellState";
import { fidelity, norm } from "./state";

describe("Bell state", () => {
  it("creates the correct Phi+ amplitudes", () => {
    const bell = createBellState();

    const expected = 1 / Math.sqrt(2);

    expect(bell.state.amplitudes[0].re).toBeCloseTo(expected);
    expect(bell.state.amplitudes[1].re).toBeCloseTo(0);
    expect(bell.state.amplitudes[2].re).toBeCloseTo(0);
    expect(bell.state.amplitudes[3].re).toBeCloseTo(expected);
  });

  it("preserves normalization", () => {
    const bell = createBellState();

    expect(norm(bell.state)).toBeCloseTo(1);
  });

  it("has the correct Bell state metadata", () => {
    const bell = createBellState();

    expect(bell.name).toBe("PHI_PLUS");
    expect(bell.equation).toBe(
      "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2"
    );
  });

  it("matches the expected Phi+ state", () => {
    const bell = createBellState();

    const expected = {
      amplitudes: [
        { re: 1 / Math.sqrt(2), im: 0 },
        { re: 0, im: 0 },
        { re: 0, im: 0 },
        { re: 1 / Math.sqrt(2), im: 0 },
      ],
      basisStates: ["00", "01", "10", "11"],
    };

    expect(fidelity(bell.state, expected)).toBeCloseTo(1);
  });
});