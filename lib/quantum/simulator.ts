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

  // Protocol/session identity fields
  experimentId?: string;
  sessionId?: string;
  signatureId?: string;
  signerId?: string;
  message?: string;
  nonce?: string;

  // Trusted identity used by the impersonation detector
  expectedSignerId?: string;
};

  /*
   * Security/replay metadata.
   *
   * These values are passed through the experiment configuration
   * when needed by higher-level security/attack logic.
   *
   * Replay detection itself does NOT happen in this simulator.
   * Replay detection belongs to the security layer / ReplayLedger.
   */
  

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
 *     ↓
 * CHSH Analysis
 *
 * NOTE:
 * Replay detection is intentionally NOT performed here.
 * It is handled by the security/ReplayLedger layer.
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

  const measurementBits: TeleportationBits = [0, 0];

  const teleportation = teleport(
    inputState,
    measurementBits,
  );

  // --------------------------------------------------
  // 4. Create deterministic seeded RNG
  //    and apply quantum-channel noise
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
  // 7. Statistical comparison
  // --------------------------------------------------

  const statistics =
    calculateStatistics(
      measurement,
      expectedDistribution,
    );

  // --------------------------------------------------
  // 8. Deterministic security verification
  // --------------------------------------------------

  const verification =
    verifyMeasurement(
      measurement,
      expectedDistribution,
      threshold,
    );

  // --------------------------------------------------
  // 9. CHSH Bell inequality simulation
  // --------------------------------------------------

  const chsh = simulateCHSH({
    seed,
    noiseModel: noise.model,
    noiseProbability: noise.probability,
    shotsPerSetting: Math.max(
      50,
      Math.floor(shots / 4),
    ),
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