import { Complex, add, mul } from "./complex";
import { QuantumState } from "./state";

export type Gate = {
  matrix: Complex[][];
};

export const I: Gate = {
  matrix: [
    [
      { re: 1, im: 0 },
      { re: 0, im: 0 },
    ],
    [
      { re: 0, im: 0 },
      { re: 1, im: 0 },
    ],
  ],
};

export const X: Gate = {
  matrix: [
    [
      { re: 0, im: 0 },
      { re: 1, im: 0 },
    ],
    [
      { re: 1, im: 0 },
      { re: 0, im: 0 },
    ],
  ],
};

export const Y: Gate = {
  matrix: [
    [
      { re: 0, im: 0 },
      { re: 0, im: -1 },
    ],
    [
      { re: 0, im: 1 },
      { re: 0, im: 0 },
    ],
  ],
};

export const Z: Gate = {
  matrix: [
    [
      { re: 1, im: 0 },
      { re: 0, im: 0 },
    ],
    [
      { re: 0, im: 0 },
      { re: -1, im: 0 },
    ],
  ],
};

const INV_SQRT_2 = 1 / Math.sqrt(2);

export const H: Gate = {
  matrix: [
    [
      { re: INV_SQRT_2, im: 0 },
      { re: INV_SQRT_2, im: 0 },
    ],
    [
      { re: INV_SQRT_2, im: 0 },
      { re: -INV_SQRT_2, im: 0 },
    ],
  ],
};

export function applySingleQubitGate(
  state: QuantumState,
  gate: Gate,
  targetQubit: number
): QuantumState {
  const dimension = state.amplitudes.length;

  if (dimension === 0 || (dimension & (dimension - 1)) !== 0) {
    throw new Error("Quantum state dimension must be a power of two");
  }

  const qubitCount = Math.log2(dimension);

  if (
    !Number.isInteger(targetQubit) ||
    targetQubit < 0 ||
    targetQubit >= qubitCount
  ) {
    throw new Error("Invalid target qubit");
  }

  const amplitudes = state.amplitudes.map((amplitude) => ({
    ...amplitude,
  }));

  const bit = qubitCount - 1 - targetQubit;
  const mask = 1 << bit;

  for (let i = 0; i < dimension; i++) {
    if ((i & mask) !== 0) {
      continue;
    }

    const j = i | mask;

    const a0 = state.amplitudes[i];
    const a1 = state.amplitudes[j];

    amplitudes[i] = add(
      mul(gate.matrix[0][0], a0),
      mul(gate.matrix[0][1], a1)
    );

    amplitudes[j] = add(
      mul(gate.matrix[1][0], a0),
      mul(gate.matrix[1][1], a1)
    );
  }

  return {
    amplitudes,
    basisStates: [...state.basisStates],
  };
}

export function applyCNOT(
  state: QuantumState,
  controlQubit: number,
  targetQubit: number
): QuantumState {
  const dimension = state.amplitudes.length;

  if (dimension === 0 || (dimension & (dimension - 1)) !== 0) {
    throw new Error("Quantum state dimension must be a power of two");
  }

  const qubitCount = Math.log2(dimension);

  if (
    !Number.isInteger(controlQubit) ||
    !Number.isInteger(targetQubit) ||
    controlQubit < 0 ||
    targetQubit < 0 ||
    controlQubit >= qubitCount ||
    targetQubit >= qubitCount ||
    controlQubit === targetQubit
  ) {
    throw new Error("Invalid CNOT qubits");
  }

  const controlBit = qubitCount - 1 - controlQubit;
  const targetBit = qubitCount - 1 - targetQubit;

  const controlMask = 1 << controlBit;
  const targetMask = 1 << targetBit;

  const amplitudes = state.amplitudes.map((amplitude) => ({
    ...amplitude,
  }));

  for (let i = 0; i < dimension; i++) {
    if ((i & controlMask) === 0) {
      continue;
    }

    const j = i ^ targetMask;

    if (i < j) {
      amplitudes[i] = state.amplitudes[j];
      amplitudes[j] = state.amplitudes[i];
    }
  }

  return {
    amplitudes,
    basisStates: [...state.basisStates],
  };
}