import { H, applyCNOT, applySingleQubitGate } from "./gates";
import { applyPauli, PauliOperator } from "./pauli";
import { BellState, createBellState } from "./bellState";
import {
  QuantumState,
  fidelity,
  tensorProduct,
} from "./state";
import { Complex, magnitudeSquared } from "./complex";

export type TeleportationBits = [number, number];

export type TeleportationResult = {
  inputState: QuantumState;
  bellState: BellState;
  measurementBits: TeleportationBits;
  correction: PauliOperator[];
  outputState: QuantumState;
  fidelity: number;
};

function zero(): Complex {
  return { re: 0, im: 0 };
}

/**
 * Extract Bob's conditional state after Alice's two qubits
 * are measured as the supplied classical bits.
 *
 * Qubit ordering:
 * q0 = Alice's unknown state
 * q1 = Alice's Bell-pair qubit
 * q2 = Bob's Bell-pair qubit
 */
function projectBobState(
  state: QuantumState,
  measurementBits: TeleportationBits,
): QuantumState {
  const [a, b] = measurementBits;

  const amplitudes: Complex[] = [zero(), zero()];

  for (let index = 0; index < state.amplitudes.length; index++) {
    const basis = state.basisStates[index];

    const q0 = Number(basis[0]);
    const q1 = Number(basis[1]);
    const q2 = Number(basis[2]);

    if (q0 === a && q1 === b) {
      amplitudes[q2] = state.amplitudes[index];
    }
  }

  const probability = amplitudes.reduce(
    (sum, amplitude) =>
      sum + magnitudeSquared(amplitude),
    0,
  );

  if (probability <= 1e-12) {
    throw new Error(
      `Measurement branch ${a}${b} has zero probability.`,
    );
  }

  return {
    basisStates: ["0", "1"],
    amplitudes: amplitudes.map((amplitude) => ({
      re: amplitude.re / Math.sqrt(probability),
      im: amplitude.im / Math.sqrt(probability),
    })),
  };
}

function getCorrection(
  bits: TeleportationBits,
): PauliOperator[] {
  const [first, second] = bits;

  if (first === 0 && second === 0) {
    return ["I"];
  }

  if (first === 0 && second === 1) {
    return ["X"];
  }

  if (first === 1 && second === 0) {
    return ["Z"];
  }

  return ["Z", "X"];
}

/**
 * Full 3-qubit quantum teleportation simulation.
 *
 * Protocol:
 *
 * 1. Prepare |ψ⟩ ⊗ |Φ+⟩
 * 2. CNOT(q0, q1)
 * 3. H(q0)
 * 4. Measure q0 and q1
 * 5. Project Bob's q2 state onto that branch
 * 6. Apply Pauli correction
 */
export function teleport(
  inputState: QuantumState,
  measurementBits: TeleportationBits,
): TeleportationResult {

  if (inputState.amplitudes.length !== 2) {
    throw new Error(
      "Teleportation requires a single-qubit input state.",
    );
  }

  // Create the Bell pair
  const bellState = createBellState();

  // Prepare |ψ⟩ ⊗ |Φ+⟩
  let threeQubitState = tensorProduct(
    inputState,
    bellState.state,
  );

  // Alice's Bell measurement circuit
  threeQubitState = applyCNOT(
    threeQubitState,
    0,
    1,
  );

  threeQubitState = applySingleQubitGate(
    threeQubitState,
    H,
    0,
  );

  // Select the requested measurement branch
  const bobState = projectBobState(
    threeQubitState,
    measurementBits,
  );

  // Determine required Pauli correction
  const correction = getCorrection(
    measurementBits,
  );

  // Apply correction to Bob's qubit
  let outputState = bobState;

  for (const operator of correction) {
    outputState = applyPauli(
      outputState,
      operator,
    );
  }

  return {
    inputState,
    bellState,
    measurementBits,
    correction,
    outputState,
    fidelity: fidelity(
      inputState,
      outputState,
    ),
  };
}