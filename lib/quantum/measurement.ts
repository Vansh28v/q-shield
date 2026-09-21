import { RNG } from "./rng";
import { QuantumState } from "./state";

export type MeasurementResult = {
  outcome: string;
  count: number;
  probability: number;
};

export type MeasurementStatistics = {
  shots: number;
  results: MeasurementResult[];
};

function probabilityFromAmplitude(
  re: number,
  im: number
): number {
  return re * re + im * im;
}

function normalizeProbabilities(
  probabilities: number[]
): number[] {
  const total = probabilities.reduce(
    (sum, value) => sum + value,
    0
  );

  if (total <= 0) {
    throw new Error(
      "Quantum state has no measurable probability."
    );
  }

  return probabilities.map((value) => value / total);
}

/**
 * Returns the theoretical probability distribution
 * without performing measurement sampling.
 */
export function getTheoreticalProbabilities(
  state: QuantumState
): MeasurementResult[] {
  if (
    state.amplitudes.length !==
    state.basisStates.length
  ) {
    throw new Error(
      "Number of amplitudes must match number of basis states."
    );
  }

  const rawProbabilities = state.amplitudes.map(
    (amplitude) =>
      probabilityFromAmplitude(
        amplitude.re,
        amplitude.im
      )
  );

  const probabilities =
    normalizeProbabilities(rawProbabilities);

  return state.basisStates.map(
    (basisState, index) => ({
      outcome: basisState,
      count: 0,
      probability: probabilities[index],
    })
  );
}

/**
 * Samples a quantum state using projective measurement
 * in the computational basis.
 *
 * The supplied seeded RNG makes the experiment reproducible.
 */
export function measureState(
  state: QuantumState,
  shots: number,
  rng: RNG
): MeasurementStatistics {
  if (!Number.isInteger(shots) || shots <= 0) {
    throw new Error(
      "Shots must be a positive integer."
    );
  }

  if (
    state.amplitudes.length !==
    state.basisStates.length
  ) {
    throw new Error(
      "Number of amplitudes must match number of basis states."
    );
  }

  const rawProbabilities = state.amplitudes.map(
    (amplitude) =>
      probabilityFromAmplitude(
        amplitude.re,
        amplitude.im
      )
  );

  const probabilities =
    normalizeProbabilities(rawProbabilities);

  const counts = new Array(
    state.basisStates.length
  ).fill(0);

  for (let shot = 0; shot < shots; shot++) {
    const randomValue = rng.next();

    let cumulative = 0;

    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];

      if (randomValue < cumulative) {
        counts[i]++;
        break;
      }
    }
  }

  const results = state.basisStates.map(
    (basisState, index) => ({
      outcome: basisState,
      count: counts[index],
      probability: counts[index] / shots,
    })
  );

  return {
    shots,
    results,
  };
}