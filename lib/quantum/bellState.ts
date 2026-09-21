import { H, applyCNOT, applySingleQubitGate } from "./gates";
import { createBasisState, QuantumState } from "./state";

export type BellStateName =
  | "PHI_PLUS"
  | "PHI_MINUS"
  | "PSI_PLUS"
  | "PSI_MINUS";

export type BellState = {
  name: BellStateName;
  state: QuantumState;
  equation: string;
};

export function createBellState(): BellState {
  // Start with |00>
  const initial = createBasisState(
    ["00", "01", "10", "11"],
    0
  );

  // Apply H to qubit 0
  const afterHadamard = applySingleQubitGate(
    initial,
    H,
    0
  );

  // Apply CNOT(0 -> 1)
  const state = applyCNOT(
    afterHadamard,
    0,
    1
  );

  return {
    name: "PHI_PLUS",
    state,
    equation: "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2",
  };
}