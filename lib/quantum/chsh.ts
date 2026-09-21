import { applySingleQubitGate, Gate } from "./gates";
import { createBasisState, QuantumState } from "./state";
import { createBellState } from "./bellState";
import { measureState } from "./measurement";
import { createRNG, RNG } from "./rng";
import { applyNoise, NoiseModel } from "./noise";

export type CHSHResult = {
  correlationXX: number;
  correlationXZ: number;
  correlationZX: number;
  correlationZZ: number;
  S: number;
  absoluteS: number;
  passesQuantumThreshold: boolean;
};

export type CHSHSettings = {
  a: number;
  aPrime: number;
  b: number;
  bPrime: number;
};

export type CHSHSimulationResult = CHSHResult & {
  measurementSettings: CHSHSettings;
  shotsPerSetting: number;
  totalShots: number;
  correlations: {
    E_ab: number;
    E_abPrime: number;
    E_aPrimeB: number;
    E_aPrimeBPrime: number;
  };
  classicalBound: number;
  quantumReference: number;
  violatesClassicalBound: boolean;
  seed: number;
};

export const CLASSICAL_CHSH_BOUND = 2;
export const QUANTUM_CHSH_BOUND = 2 * Math.sqrt(2);

/**
 * Creates a single-qubit Y-axis rotation gate Ry(phi).
 */
function createRyGate(phi: number): Gate {
  const cos = Math.cos(phi / 2);
  const sin = Math.sin(phi / 2);
  return {
    matrix: [
      [{ re: cos, im: 0 }, { re: -sin, im: 0 }],
      [{ re: sin, im: 0 }, { re: cos, im: 0 }],
    ],
  };
}

/**
 * Calculate the CHSH Bell parameter.
 *
 * S = E(a,b) + E(a,b') + E(a',b) - E(a',b')
 */
export function calculateCHSH(
  correlationXX: number,
  correlationXZ: number,
  correlationZX: number,
  correlationZZ: number,
): CHSHResult {
  const correlations = [
    correlationXX,
    correlationXZ,
    correlationZX,
    correlationZZ,
  ];

  if (
    correlations.some(
      (value) =>
        !Number.isFinite(value) ||
        value < -1 ||
        value > 1,
    )
  ) {
    throw new Error(
      "CHSH correlations must be finite values between -1 and 1.",
    );
  }

  const S =
    correlationXX +
    correlationXZ +
    correlationZX -
    correlationZZ;

  const absoluteS = Math.abs(S);

  return {
    correlationXX,
    correlationXZ,
    correlationZX,
    correlationZZ,
    S,
    absoluteS,
    passesQuantumThreshold:
      absoluteS > CLASSICAL_CHSH_BOUND,
  };
}

/**
 * Ideal CHSH correlations for a maximally entangled quantum state.
 */
export function idealCHSH(): CHSHResult {
  const correlation = 1 / Math.sqrt(2);

  return calculateCHSH(
    correlation,
    correlation,
    correlation,
    -correlation,
  );
}

/**
 * Simulate CHSH measurement outcomes on a 2-qubit state
 * across 4 rotated detector settings.
 */
export function simulateCHSH(config?: {
  state?: QuantumState;
  shotsPerSetting?: number;
  seed?: number;
  noiseModel?: NoiseModel;
  noiseProbability?: number;
  angles?: CHSHSettings;
}): CHSHSimulationResult {
  const seed = config?.seed ?? 12345;
  const rng = createRNG(seed);
  const shots = config?.shotsPerSetting ?? 1000;
  const initialState = config?.state ?? createBellState().state;
  const noiseModel = config?.noiseModel ?? "NONE";
  const noiseProbability = config?.noiseProbability ?? 0;

  // Optimal CHSH detector angles for max violation (2√2):
  // Alice: a = 0, a' = π/2
  // Bob: b = π/4, b' = -π/4
  const settings: CHSHSettings = config?.angles ?? {
    a: 0,
    aPrime: Math.PI / 2,
    b: Math.PI / 4,
    bPrime: -Math.PI / 4,
  };

  function computeCorrelation(angleA: number, angleB: number): number {
    // 1. Apply channel noise if configured
    let state = initialState;
    if (noiseModel !== "NONE" && noiseProbability > 0) {
      const n0 = applyNoise(
        { basisStates: ["0", "1"], amplitudes: [state.amplitudes[0], state.amplitudes[1]] },
        noiseModel,
        noiseProbability,
        rng,
      );
      state = {
        ...state,
        amplitudes: [
          n0.state.amplitudes[0],
          n0.state.amplitudes[1],
          state.amplitudes[2],
          state.amplitudes[3],
        ],
      };
    }

    // 2. Rotate qubit 0 by -angleA and qubit 1 by -angleB
    let rotated = applySingleQubitGate(state, createRyGate(-angleA), 0);
    rotated = applySingleQubitGate(rotated, createRyGate(-angleB), 1);

    // 3. Perform projective measurement
    const ms = measureState(rotated, shots, rng);

    // Outcomes in 2-qubit basis: "00", "01", "10", "11"
    let c00 = 0, c01 = 0, c10 = 0, c11 = 0;
    for (const r of ms.results) {
      if (r.outcome === "00") c00 = r.count;
      else if (r.outcome === "01") c01 = r.count;
      else if (r.outcome === "10") c10 = r.count;
      else if (r.outcome === "11") c11 = r.count;
    }

    // Correlation: E = (N00 + N11 - N01 - N10) / N
    return (c00 + c11 - c01 - c10) / shots;
  }

  const E_ab = computeCorrelation(settings.a, settings.b);
  const E_abPrime = computeCorrelation(settings.a, settings.bPrime);
  const E_aPrimeB = computeCorrelation(settings.aPrime, settings.b);
  const E_aPrimeBPrime = computeCorrelation(settings.aPrime, settings.bPrime);

  const S = E_ab + E_abPrime + E_aPrimeB - E_aPrimeBPrime;
  const absoluteS = Math.abs(S);
  const violates = absoluteS > CLASSICAL_CHSH_BOUND;

  return {
    correlationXX: E_ab,
    correlationXZ: E_abPrime,
    correlationZX: E_aPrimeB,
    correlationZZ: E_aPrimeBPrime,
    S,
    absoluteS,
    passesQuantumThreshold: violates,
    measurementSettings: settings,
    shotsPerSetting: shots,
    totalShots: shots * 4,
    correlations: {
      E_ab,
      E_abPrime,
      E_aPrimeB,
      E_aPrimeBPrime,
    },
    classicalBound: CLASSICAL_CHSH_BOUND,
    quantumReference: QUANTUM_CHSH_BOUND,
    violatesClassicalBound: violates,
    seed,
  };
}