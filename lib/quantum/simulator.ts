import { createBellState } from "./bellState";
import {
  createRNG,
  RNG,
} from "./rng";
import {
  QuantumState,
  normalize,
} from "./state";
import {
  teleport,
  TeleportationBits,
} from "./teleportation";
import {
  getTheoreticalProbabilities,
  measureState,
  MeasurementStatistics,
} from "./measurement";
import {
  calculateStatistics,
  StatisticalMetrics,
} from "./statistics";
import {
  verifyMeasurement,
  VerificationResult,
} from "./verification";
import {
  applyNoise,
  NoiseModel,
  NoiseResult,
} from "./noise";
import {
  simulateCHSH,
  CHSHSimulationResult,
} from "./chsh";

export type QDSExperimentConfig = {
  alpha: number;
  beta: number;
  shots: number;
  threshold: number;
  seed?: number;
  noise?: {
    model: NoiseModel;
    probability: number;
  };
};

export type QDSExperimentResult = {
  inputState: QuantumState;
  bellState: ReturnType<typeof createBellState>;
  teleportation: ReturnType<typeof teleport>;
  noise: NoiseResult;
  measurement: MeasurementStatistics;
  expectedDistribution: ReturnType<
    typeof getTheoreticalProbabilities
  >;
  statistics: StatisticalMetrics;
  verification: VerificationResult;
  chsh: CHSHSimulationResult;
};

function createInputState(
  alpha: number,
  beta: number,
): QuantumState {
  return normalize({
    basisStates: ["0", "1"],
    amplitudes: [
      {
        re: alpha,
        im: 0,
      },
      {
        re: beta,
        im: 0,
      },
    ],
  });
}

/**
 * Run an end-to-end QDS quantum experiment.
 *
 * Pipeline:
 *
 * Input State
 *     ↓
 * Bell State
 *     ↓
 * Teleportation
 *     ↓
 * Channel Noise
 *     ↓
 * Measurement
 *     ↓
 * Statistical Analysis
 *     ↓
 * Threshold Verification
 */
export function runQDSExperiment(
  config: QDSExperimentConfig,
): QDSExperimentResult {
  const {
    alpha,
    beta,
    shots,
    threshold,
    seed = 12345,
    noise = {
      model: "NONE",
      probability: 0,
    },
  } = config;

  // --------------------------------------------------
  // 1. Create the quantum input state
  // --------------------------------------------------

  const inputState = createInputState(
    alpha,
    beta,
  );

  // --------------------------------------------------
  // 2. Create Bell-state entanglement
  // --------------------------------------------------

  const bellState = createBellState();

  // --------------------------------------------------
  // 3. Run actual 3-qubit teleportation
  // --------------------------------------------------

  const measurementBits: TeleportationBits = [
    0,
    0,
  ];

  const teleportation = teleport(
    inputState,
    measurementBits,
  );

  // --------------------------------------------------
  // 4. Create deterministic seeded RNG & Apply quantum-channel noise
  // --------------------------------------------------

  const rng: RNG = createRNG(seed);

  const noiseResult = applyNoise(
    teleportation.outputState,
    noise.model,
    noise.probability,
    rng,
  );

  // --------------------------------------------------
  // 5. Calculate expected distribution
  //
  // The clean teleported state is the reference.
  // --------------------------------------------------

  const expectedDistribution =
    getTheoreticalProbabilities(
      teleportation.outputState,
    );

  // --------------------------------------------------
  // 6. Measure the noisy state
  // --------------------------------------------------

  const measurement = measureState(
    noiseResult.state,
    shots,
    rng,
  );

  // --------------------------------------------------
  // 8. Statistical comparison
  // --------------------------------------------------

  const statistics =
    calculateStatistics(
      measurement,
      expectedDistribution,
    );

  // --------------------------------------------------
  // 9. Deterministic security verification
  // --------------------------------------------------

  const verification =
    verifyMeasurement(
      measurement,
      expectedDistribution,
      threshold,
    );

  // --------------------------------------------------
  // 10. CHSH Bell inequality simulation
  // --------------------------------------------------

  const chsh = simulateCHSH({
    seed,
    noiseModel: noise.model,
    noiseProbability: noise.probability,
    shotsPerSetting: Math.max(50, Math.floor(shots / 4)),
  });

  return {
    inputState,
    bellState,
    teleportation,
    noise: noiseResult,
    measurement,
    expectedDistribution,
    statistics,
    verification,
    chsh,
  };
}