import { Complex } from "./complex";
import { QuantumState } from "./state";
import { I, X, Y, Z, applySingleQubitGate } from "./gates";

export type PauliOperator = "I" | "X" | "Y" | "Z";

export type PauliEigenvalue = 1 | -1;

export type PauliEigenstate =
  | "ZERO"
  | "ONE"
  | "PLUS"
  | "MINUS"
  | "PLUS_I"
  | "MINUS_I";

const SQRT_HALF = 1 / Math.sqrt(2);

const ZERO_STATE: QuantumState = {
  amplitudes: [
    { re: 1, im: 0 },
    { re: 0, im: 0 },
  ],
  basisStates: ["0", "1"],
};

const ONE_STATE: QuantumState = {
  amplitudes: [
    { re: 0, im: 0 },
    { re: 1, im: 0 },
  ],
  basisStates: ["0", "1"],
};

const PLUS_STATE: QuantumState = {
  amplitudes: [
    { re: SQRT_HALF, im: 0 },
    { re: SQRT_HALF, im: 0 },
  ],
  basisStates: ["0", "1"],
};

const MINUS_STATE: QuantumState = {
  amplitudes: [
    { re: SQRT_HALF, im: 0 },
    { re: -SQRT_HALF, im: 0 },
  ],
  basisStates: ["0", "1"],
};

const PLUS_I_STATE: QuantumState = {
  amplitudes: [
    { re: SQRT_HALF, im: 0 },
    { re: 0, im: SQRT_HALF },
  ],
  basisStates: ["0", "1"],
};

const MINUS_I_STATE: QuantumState = {
  amplitudes: [
    { re: SQRT_HALF, im: 0 },
    { re: 0, im: -SQRT_HALF },
  ],
  basisStates: ["0", "1"],
};

export function getPauliOperator(operator: PauliOperator) {
  switch (operator) {
    case "I":
      return I;
    case "X":
      return X;
    case "Y":
      return Y;
    case "Z":
      return Z;
  }
}

export function getPauliEigenstate(
  operator: PauliOperator,
  eigenvalue: PauliEigenvalue
): QuantumState {
  if (operator === "I") {
    throw new Error("Identity does not have a unique ±1 eigenstate");
  }

  if (operator === "Z") {
    return eigenvalue === 1 ? cloneState(ZERO_STATE) : cloneState(ONE_STATE);
  }

  if (operator === "X") {
    return eigenvalue === 1 ? cloneState(PLUS_STATE) : cloneState(MINUS_STATE);
  }

  return eigenvalue === 1
    ? cloneState(PLUS_I_STATE)
    : cloneState(MINUS_I_STATE);
}

export function applyPauli(
  state: QuantumState,
  operator: PauliOperator
): QuantumState {
  return applySingleQubitGate(state, getPauliOperator(operator), 0);
}

function cloneState(state: QuantumState): QuantumState {
  return {
    amplitudes: state.amplitudes.map((amplitude: Complex) => ({
      re: amplitude.re,
      im: amplitude.im,
    })),
    basisStates: [...state.basisStates],
  };
}