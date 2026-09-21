import {
  Complex,
  add,
  conj,
  magnitudeSquared,
  mul,
  scale,
} from "./complex";

export type QuantumState = {
  amplitudes: Complex[];
  basisStates: string[];
};

const EPSILON = 1e-12;

export function norm(state: QuantumState): number {
  const sum = state.amplitudes.reduce(
    (total, amplitude) => total + magnitudeSquared(amplitude),
    0
  );

  return Math.sqrt(sum);
}

export function normalize(state: QuantumState): QuantumState {
  const stateNorm = norm(state);

  if (stateNorm < EPSILON) {
    throw new Error("Cannot normalize a zero state");
  }

  return {
    amplitudes: state.amplitudes.map((amplitude) =>
      scale(amplitude, 1 / stateNorm)
    ),
    basisStates: [...state.basisStates],
  };
}

export function innerProduct(
  a: QuantumState,
  b: QuantumState
): Complex {
  if (a.amplitudes.length !== b.amplitudes.length) {
    throw new Error("States must have the same dimension");
  }

  return a.amplitudes.reduce(
    (sum, amplitude, index) =>
      add(sum, mul(conj(amplitude), b.amplitudes[index])),
    { re: 0, im: 0 }
  );
}

export function fidelity(
  a: QuantumState,
  b: QuantumState
): number {
  const overlap = innerProduct(a, b);

  return magnitudeSquared(overlap);
}

export function tensorProduct(
  a: QuantumState,
  b: QuantumState
): QuantumState {
  const amplitudes: Complex[] = [];
  const basisStates: string[] = [];

  for (let i = 0; i < a.amplitudes.length; i++) {
    for (let j = 0; j < b.amplitudes.length; j++) {
      amplitudes.push(mul(a.amplitudes[i], b.amplitudes[j]));
      basisStates.push(`${a.basisStates[i]}${b.basisStates[j]}`);
    }
  }

  return {
    amplitudes,
    basisStates,
  };
}

export function createBasisState(
  basisStates: string[],
  index: number
): QuantumState {
  if (index < 0 || index >= basisStates.length) {
    throw new Error("Basis index out of range");
  }

  const amplitudes: Complex[] = basisStates.map((_, i) => ({
    re: i === index ? 1 : 0,
    im: 0,
  }));

  return {
    amplitudes,
    basisStates: [...basisStates],
  };
}