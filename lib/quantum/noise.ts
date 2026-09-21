import { applyPauli, PauliOperator } from "./pauli";
import { QuantumState } from "./state";
import { RNG } from "./rng";

export type NoiseModel =
  | "NONE"
  | "BIT_FLIP"
  | "PHASE_FLIP"
  | "BIT_PHASE_FLIP"
  | "DEPOLARIZING";

export type NoiseResult = {
  state: QuantumState;
  model: NoiseModel;
  probability: number;
  appliedOperator: PauliOperator;
};

/**
 * Apply a stochastic Pauli noise channel to a single-qubit state
 * using a seeded PRNG.
 */
export function applyNoise(
  state: QuantumState,
  model: NoiseModel,
  probability = 1,
  rng?: RNG,
): NoiseResult {
  if (
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1
  ) {
    throw new Error(
      "Noise probability must be between 0 and 1.",
    );
  }

  if (probability === 0 || model === "NONE") {
    return {
      state,
      model,
      probability,
      appliedOperator: "I",
    };
  }

  // Roll seeded RNG to determine if an error occurs for this shot
  const shouldDisturb = rng ? rng.next() < probability : true;

  if (!shouldDisturb) {
    return {
      state,
      model,
      probability,
      appliedOperator: "I",
    };
  }

  let appliedOperator: PauliOperator = "I";

  switch (model) {
    case "BIT_FLIP":
      appliedOperator = "X";
      break;

    case "PHASE_FLIP":
      appliedOperator = "Z";
      break;

    case "BIT_PHASE_FLIP":
      appliedOperator = "Y";
      break;

    case "DEPOLARIZING": {
      const paulis: PauliOperator[] = ["X", "Y", "Z"];
      const index = rng ? rng.nextInt(3) : 1; // 1 -> "Y" default for deterministic fallback
      appliedOperator = paulis[index];
      break;
    }

    default:
      throw new Error(`Unsupported noise model: ${model}`);
  }

  return {
    state: applyPauli(state, appliedOperator),
    model,
    probability,
    appliedOperator,
  };
}