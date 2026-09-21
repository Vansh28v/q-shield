import {
  runQDSExperiment,
  QDSExperimentConfig,
} from "../quantum/simulator";

import {
  QuantumState,
} from "../quantum/state";

import {
  createRNG,
} from "../quantum/rng";

import {
  detectThreat,
  ThreatDetectorResult,
} from "./detector";

import {
  ReplayLedger,
  LedgerCheckResult,
} from "./ledger";

import {
  createSignature,
  SignatureRecord,
  SignatureVerification,
  verifySignature,
} from "./signature";

import {
  SignatureSession,
} from "./types";

/**
 * Security experiment configuration.
 *
 * The message is now cryptographically bound to the
 * deterministic quantum-state generation.
 */
export type SecurityExperimentConfig =
  QDSExperimentConfig & {
    experimentId: string;
    sessionId: string;
    signatureId: string;
    signerId: string;
    message: string;
    nonce: string;

    createdAt?: number;

    expectedSignerId?: string;
    expectedMessage?: string;

    unauthorizedVerification?: boolean;
  };

export type SecurityExperimentResult = {
  experimentId: string;

  session: SignatureSession;

  signature: SignatureRecord;

  signatureVerification: SignatureVerification;

  quantum: ReturnType<typeof runQDSExperiment>;

  replay: LedgerCheckResult;

  threat: ThreatDetectorResult;

  latencyMs: number;

  createdAt: number;
};

/**
 * Converts a string into a deterministic unsigned 32-bit hash.
 *
 * This is NOT intended to be a cryptographic hash.
 *
 * Its purpose here is to deterministically derive a
 * reproducible quantum experiment from the supplied
 * message/signing context.
 */
function hashString(
  value: string,
): number {
  let hash = 2166136261;

  for (
    let index = 0;
    index < value.length;
    index++
  ) {
    hash ^= value.charCodeAt(index);

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return hash >>> 0;
}

/**
 * Creates deterministic quantum amplitudes from the
 * message/signing context.
 *
 * The resulting state is always normalized.
 */
function deriveQuantumParameters(
  message: string,
  signerId: string,
  nonce: string,
  seed?: number,
): {
  alpha: number;
  beta: number;
  seed: number;
} {
  const context =
    `${message}|${signerId}|${nonce}`;

  const messageHash =
    hashString(context);

  const baseSeed =
    (
      (seed ?? 0) ^
      messageHash
    ) >>> 0;

  const rng =
    createRNG(baseSeed);

  /*
   * Generate an angle in [0, π/2].
   *
   * alpha = cos(theta)
   * beta  = sin(theta)
   *
   * Therefore:
   *
   * |alpha|² + |beta|² = 1
   */
  const theta =
    rng.next() *
    (Math.PI / 2);

  const alpha =
    Math.cos(theta);

  const beta =
    Math.sin(theta);

  return {
    alpha,
    beta,
    seed: baseSeed,
  };
}

/**
 * Runs the complete Q-SHIELD security experiment.
 */
export function runSecurityExperiment(
  config: SecurityExperimentConfig,
  ledger: ReplayLedger,
): SecurityExperimentResult {
  const startedAt =
    performance.now();

  if (
    !config.experimentId.trim()
  ) {
    throw new Error(
      "experimentId is required.",
    );
  }

  if (
    !config.sessionId.trim()
  ) {
    throw new Error(
      "sessionId is required.",
    );
  }

  if (
    !config.signatureId.trim()
  ) {
    throw new Error(
      "signatureId is required.",
    );
  }

  if (
    !config.signerId.trim()
  ) {
    throw new Error(
      "signerId is required.",
    );
  }

  if (
    !config.message.trim()
  ) {
    throw new Error(
      "message is required.",
    );
  }

  if (
    !config.nonce.trim()
  ) {
    throw new Error(
      "nonce is required.",
    );
  }

  const createdAt =
    config.createdAt ??
    Date.now();

  /*
   * --------------------------------------------------
   * MESSAGE → QUANTUM STATE
   * --------------------------------------------------
   *
   * The supplied message/signing context determines
   * the quantum state used by this experiment.
   */
  const derived =
    deriveQuantumParameters(
      config.message,
      config.signerId,
      config.nonce,
      config.seed,
    );

  const quantumConfig:
    QDSExperimentConfig = {
      ...config,

      alpha:
        derived.alpha,

      beta:
        derived.beta,

      seed:
        derived.seed,
    };

  /*
   * --------------------------------------------------
   * QUANTUM SECURITY ENGINE
   * --------------------------------------------------
   */
  const quantum =
    runQDSExperiment(
      quantumConfig,
    );

  /*
   * --------------------------------------------------
   * SIGNATURE CREATION
   * --------------------------------------------------
   */
  const signature =
    createSignature(
      config.signatureId,
      config.message,
      config.signerId,
      config.sessionId,
      config.nonce,
      quantum.teleportation
        .outputState,
      createdAt,
    );

  /*
   * --------------------------------------------------
   * SIGNATURE VERIFICATION
   * --------------------------------------------------
   */
  const signatureVerification =
    verifySignature(
      signature,

      config.expectedMessage ??
        config.message,

      config.expectedSignerId ??
        config.signerId,

      quantum.teleportation
        .outputState,
    );

  /*
   * --------------------------------------------------
   * REPLAY PROTECTION
   * --------------------------------------------------
   */
  const replay =
    ledger.check(
      signature.signatureId,
      signature.sessionId,
      signature.nonce,
    );

  if (replay.fresh) {
    ledger.record(
      signature.signatureId,
      signature.sessionId,
      signature.nonce,
      signature.signerId,
      signature.createdAt,
    );
  }

  /*
   * --------------------------------------------------
   * THREAT DETECTION
   * --------------------------------------------------
   */
  const threat =
    detectThreat({
      verification:
        quantum.verification,

      replayDetected:
        !replay.fresh,

      unauthorizedVerification:
        config.unauthorizedVerification,

      chsh: quantum.chsh,
    });

  const session:
    SignatureSession = {
      sessionId:
        config.sessionId,

      signature,

      verification:
        signatureVerification,

      replay,

      threat,

      createdAt,

      updatedAt:
        Date.now(),
    };

  const latencyMs =
    performance.now() -
    startedAt;

  return {
    experimentId:
      config.experimentId,

    session,

    signature,

    signatureVerification,

    quantum,

    replay,

    threat,

    latencyMs,

    createdAt,
  };
}